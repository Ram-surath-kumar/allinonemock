import express from 'express';
import { secureDb } from '../services/db.js';
import { handleError, sendSuccess, sendValidationError } from '../common.js';

const router = express.Router();

/**
 * @route GET /api/transport/routes
 * @desc Get all transport routes with deep details (stops, vehicle)
 */
router.get('/routes', async (req, res) => {
    try {
        const { org_id } = req.query;
        // Fetch detailed routes
        const routes = await secureDb.get('transport_routes', q => {
            if (org_id) return q.eq('org_id', org_id);
            return q.order('route_name');
        });

        const { supabaseAdmin } = await import('../common.js');

        // Loop through routes to attach stops and vehicles
        const enrichedRoutes = await Promise.all(routes.map(async (route) => {
            const stops = await secureDb.get('transport_stops', q => q.eq('route_id', route.id).order('stop_order'));

            // New: Fetch multiple vehicles via junction table
            const { data: routeVehicles } = await supabaseAdmin
                .from('transport_route_vehicles')
                .select('vehicle_id, vehicles(*)')
                .eq('route_id', route.id);

            const vehicles = routeVehicles ? routeVehicles.map(rv => rv.vehicles) : [];

            // Fallback for backward compatibility if data exists in old column
            if (vehicles.length === 0 && route.vehicle_id) {
                const oldVehicles = await secureDb.get('transport_vehicles', q => q.eq('id', route.vehicle_id));
                if (oldVehicles[0]) vehicles.push(oldVehicles[0]);
            }

            return { ...route, stops, vehicles, vehicle: vehicles[0] || null }; // vehicle kept for legacy UI compat if needed
        }));

        sendSuccess(res, enrichedRoutes);
    } catch (error) {
        handleError(error, res, 'Failed to fetch routes');
    }
});

/**
 * @route POST /api/transport/routes
 * @desc Create a new transport route with stats and schedule
 */
router.post('/routes', async (req, res) => {
    try {
        const { stops, ...routeData } = req.body;
        const context = { user: req.user };

        if (!routeData.route_name) return sendValidationError(res, 'Route Name is required');

        // Helper to clean numeric fields
        const cleanNumber = (val) => (val === '' || val === null || val === undefined) ? null : Number(val);
        // Helper to clean UUIDs/FKs
        const cleanStr = (val) => (val === '' || val === 'null' || val === null || val === undefined) ? null : val;

        const cleanRouteData = {
            ...routeData,
            vehicle_id: cleanStr(routeData.vehicle_id),
            distance_km: cleanNumber(routeData.distance_km),
            est_travel_time_mins: cleanNumber(routeData.est_travel_time_mins),
            peak_hour_delay_mins: cleanNumber(routeData.peak_hour_delay_mins),
            avg_cost_per_student: cleanNumber(routeData.avg_cost_per_student),
            cost_per_km: cleanNumber(routeData.cost_per_km),
            cost_per_trip: cleanNumber(routeData.cost_per_trip),
        };

        // Create Route
        const newRoute = await secureDb.create('transport_routes', cleanRouteData, context);
        const { supabaseAdmin } = await import('../common.js');

        // Handle Multiple Vehicles
        if (routeData.vehicle_ids && Array.isArray(routeData.vehicle_ids)) {
            for (const vid of routeData.vehicle_ids) {
                await supabaseAdmin.from('transport_route_vehicles').insert({
                    route_id: newRoute.id,
                    vehicle_id: vid
                });
            }
        }

        // Create Stops
        if (stops && Array.isArray(stops)) {
            let order = 1;
            for (const stop of stops) {
                await secureDb.create('transport_stops', {
                    route_id: newRoute.id,
                    stop_name: stop.stop_name,
                    stop_order: order++,
                    arrival_time: stop.arrival_time,
                    // Advanced fields
                    stop_id: stop.stop_id,
                    latitude: stop.latitude,
                    longitude: stop.longitude,
                    stop_duration_mins: stop.stop_duration_mins || 1,
                    avg_boarding_count: stop.avg_boarding_count || 0,
                    address: stop.address
                }, context);
            }
        }

        sendSuccess(res, newRoute);
    } catch (error) {
        handleError(error, res, 'Failed to create route');
    }
});

/**
 * @route POST /api/transport/register
 * @desc Enroll a student with detailed passenger info and fees
 */
router.post('/register', async (req, res) => {
    try {
        const data = req.body;
        const context = { user: req.user };

        // 1. Generate Registration ID (TSREG-YYYY-XXXX)
        const year = new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000); // Simple random for demo
        const regId = `TSREG-${year}-${rand}`;

        // 2. Prepare payload
        const payload = {
            ...data,
            reg_id: regId,
            status: 'active',
            reg_date: new Date().toISOString(),
            vehicle_id: data.vehicle_id || null // Save allocated vehicle
        };

        // 3. Create Registration
        const registration = await secureDb.create('transport_registrations', payload, context);

        // 4. Create Fee Installments (Example Logic)
        if (data.fee_annual > 0) {
            const semFee = data.fee_annual / 2;

            // Installment 1
            await secureDb.create('transport_fee_payments', {
                registration_id: registration.id,
                installment_no: 1,
                amount_due: semFee,
                due_date: new Date().toISOString(), // Immediate
                status: 'Pending'
            }, context);

            // Installment 2 (6 months later)
            const date2 = new Date();
            date2.setMonth(date2.getMonth() + 6);
            await secureDb.create('transport_fee_payments', {
                registration_id: registration.id,
                installment_no: 2,
                amount_due: semFee,
                due_date: date2.toISOString(),
                status: 'Pending'
            }, context);
        }

        sendSuccess(res, registration);
    } catch (error) {
        handleError(error, res, 'Failed to register student');
    }
});

/**
 * @route GET /api/transport/vehicles
 */
router.get('/vehicles', async (req, res) => {
    try {
        const vehicles = await secureDb.get('transport_vehicles');
        sendSuccess(res, vehicles);
    } catch (error) {
        handleError(error, res, 'Failed to fetch vehicles');
    }
});

/**
 * @route POST /api/transport/vehicles
 */
router.post('/vehicles', async (req, res) => {
    try {
        const context = { user: req.user };
        const newVehicle = await secureDb.create('transport_vehicles', req.body, context);
        sendSuccess(res, newVehicle);
    } catch (error) {
        handleError(error, res, 'Failed to add vehicle');
    }
});

/**
 * @route GET /api/transport/vehicles/:id
 * @desc Get vehicle details including route, passengers, notes, and tasks
 */
router.get('/vehicles/:id', async (req, res) => {
    try {
        const { supabaseAdmin } = await import('../common.js');

        // 1. Fetch Vehicle (using supabaseAdmin to bypass RLS if needed)
        const { data: vehicle, error: vehicleError } = await supabaseAdmin
            .from('transport_vehicles')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (vehicleError) {
            console.error('Error fetching vehicle:', req.params.id, vehicleError);
            if (vehicleError.code === 'PGRST116') {
                return res.status(404).json({ data: null, error: 'Vehicle not found' });
            }
            throw vehicleError;
        }

        // 2. Fetch Linked Route (using maybeSingle)
        const { data: routeData } = await supabaseAdmin
            .from('transport_routes')
            .select('*')
            .eq('vehicle_id', req.params.id)
            .maybeSingle();

        let passengers = [];
        let routeStops = [];

        if (routeData) {
            // 3. Fetch Passengers (Students)
            const { data: students } = await supabaseAdmin
                .from('transport_registrations')
                .select('*, student:users(*)')
                .eq('route_id', routeData.id)
                .eq('status', 'active');

            if (students) passengers = students;

            // 4. Fetch Route Stops
            const { data: stops } = await supabaseAdmin
                .from('route_stops')
                .select('*')
                .eq('route_id', routeData.id)
                .order('stop_order', { ascending: true });

            if (stops) routeStops = stops;
        }

        // 5. Fetch Notes
        const { data: notes } = await supabaseAdmin
            .from('vehicle_notes')
            .select('*')
            .eq('vehicle_id', req.params.id)
            .order('created_at', { ascending: false });

        // 6. Fetch Tasks
        const { data: tasks } = await supabaseAdmin
            .from('vehicle_tasks')
            .select('*')
            .eq('vehicle_id', req.params.id)
            .order('due_date', { ascending: true });

        sendSuccess(res, {
            ...vehicle,
            route: routeData ? { ...routeData, stops: routeStops } : null,
            passengers: passengers || [],
            notes: notes || [],
            tasks: tasks || []
        });

    } catch (error) {
        handleError(error, res, 'Failed to fetch vehicle details');
    }
});

/**
 * @route GET /api/transport/student/:studentId
 */
router.get('/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const registrations = await secureDb.get('transport_registrations', q =>
            q.eq('student_id', studentId).eq('status', 'active')
        );

        if (registrations.length === 0) return sendSuccess(res, null);

        const reg = registrations[0];

        // Fetch Payments
        const payments = await secureDb.get('transport_fee_payments', q => q.eq('registration_id', reg.id));

        sendSuccess(res, {
            ...reg,
            payments
        });

    } catch (error) {
        handleError(error, res, 'Failed to fetch student transport details');
    }
});

/**
 * @route GET /api/transport/routes/:id/stops
 * @desc Get stops for a specific route
 */
router.get('/routes/:id/stops', async (req, res) => {
    try {
        const { supabaseAdmin } = await import('../common.js');

        const { data: stops, error } = await supabaseAdmin
            .from('transport_stops')
            .select('*')
            .eq('route_id', req.params.id)
            .order('stop_order', { ascending: true });

        if (error) throw error;
        sendSuccess(res, stops || []);
    } catch (error) {
        handleError(error, res, 'Failed to fetch route stops');
    }
});

/**
 * @route PUT /api/transport/routes/:id
 * @desc Update a transport route
 */
router.put('/routes/:id', async (req, res) => {
    try {
        const context = { user: req.user };
        const { id } = req.params;
        const cleanStr = (val) => (val === '' || val === 'null' || val === null || val === undefined) ? null : val;

        const { vehicle_ids, stops, ...routeData } = req.body;

        const updateData = {
            ...routeData,
            vehicle_id: cleanStr(req.body.vehicle_id)
        };

        const updatedRoute = await secureDb.update('transport_routes', id, updateData, context);

        const { supabaseAdmin } = await import('../common.js');

        // Update Vehicles (Delete all and re-insert)
        if (vehicle_ids && Array.isArray(vehicle_ids)) {
            // Delete existing
            await supabaseAdmin.from('transport_route_vehicles').delete().eq('route_id', id);

            // Insert new
            for (const vid of vehicle_ids) {
                await supabaseAdmin.from('transport_route_vehicles').insert({
                    route_id: id,
                    vehicle_id: vid
                });
            }
        }

        // Update Stops (if provided)
        if (stops && Array.isArray(stops)) {
            // Basic implementation: Delete all and re-create (simplest for ordering)
            await supabaseAdmin.from('transport_stops').delete().eq('route_id', id);
            let order = 1;
            for (const stop of stops) {
                await secureDb.create('transport_stops', {
                    route_id: id,
                    stop_name: stop.stop_name,
                    stop_order: order++,
                    arrival_time: stop.arrival_time,
                    stop_id: stop.stop_id,
                    latitude: stop.latitude,
                    longitude: stop.longitude,
                    stop_duration_mins: stop.stop_duration_mins || 1,
                    avg_boarding_count: stop.avg_boarding_count || 0,
                    address: stop.address
                }, context);
            }
        }

        sendSuccess(res, updatedRoute);
    } catch (error) {
        handleError(error, res, 'Failed to update route');
    }
});

/**
 * @route DELETE /api/transport/routes/:id
 * @desc Delete a transport route
 */
router.delete('/routes/:id', async (req, res) => {
    try {
        const context = { user: req.user };
        const { id } = req.params;

        await secureDb.delete('transport_routes', id, context);
        sendSuccess(res, { message: 'Route deleted successfully' });
    } catch (error) {
        handleError(error, res, 'Failed to delete route');
    }
});

/**
 * @route GET /api/transport/registrations
 * @desc Get all transport registrations
 */
router.get('/registrations', async (req, res) => {
    try {
        const registrations = await secureDb.get('transport_registrations');
        sendSuccess(res, registrations);
    } catch (error) {
        handleError(error, res, 'Failed to fetch registrations');
    }
});

/**
 * @route GET /api/transport/route/:routeId/students
 * @desc Get all students registered for a specific route
 */
router.get('/route/:routeId/students', async (req, res) => {
    try {
        const { routeId } = req.params;
        const registrations = await secureDb.get('transport_registrations', q =>
            q.eq('route_id', routeId).eq('status', 'active')
        );
        sendSuccess(res, registrations);
    } catch (error) {
        handleError(error, res, 'Failed to fetch route students');
    }
});

/**
 * @route DELETE /api/transport/registrations/:id
 * @desc Delete a transport registration (remove student from route)
 */
router.delete('/registrations/:id', async (req, res) => {
    try {
        const context = { user: req.user };
        const { id } = req.params;

        await secureDb.delete('transport_registrations', id, context);
        sendSuccess(res, { message: 'Student removed from route successfully' });
    } catch (error) {
        handleError(error, res, 'Failed to remove student from route');
    }
});

/**
 * @route POST /api/transport/vehicles/:id/notes
 * @desc Add a note to a vehicle
 */
router.post('/vehicles/:id/notes', async (req, res) => {
    try {
        const { supabaseAdmin } = await import('../common.js');
        const context = { user: req.user };

        const { data, error } = await supabaseAdmin
            .from('vehicle_notes')
            .insert([{
                vehicle_id: req.params.id,
                ...req.body
            }])
            .select()
            .single();

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to add note');
    }
});

/**
 * @route POST /api/transport/vehicles/:id/tasks
 * @desc Add a task to a vehicle
 */
router.post('/vehicles/:id/tasks', async (req, res) => {
    try {
        const { supabaseAdmin } = await import('../common.js');
        const context = { user: req.user };

        const { data, error } = await supabaseAdmin
            .from('vehicle_tasks')
            .insert([{
                vehicle_id: req.params.id,
                status: 'Pending',
                ...req.body
            }])
            .select()
            .single();

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to add task');
    }
});

/**
 * @route DELETE /api/transport/vehicles/:id
 * @desc Delete a vehicle
 */
router.delete('/vehicles/:id', async (req, res) => {
    try {
        const { supabaseAdmin } = await import('../common.js');
        const context = { user: req.user };

        const { error } = await supabaseAdmin
            .from('vehicles')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        sendSuccess(res, { message: 'Vehicle deleted successfully' });
    } catch (error) {
        handleError(error, res, 'Failed to delete vehicle');
    }
});

/**
 * @route GET /api/transport/crew
 * @desc Get all drivers and conductors for crew assignment
 */
router.get('/crew', async (req, res) => {
    try {
        const { supabaseAdmin } = await import('../common.js');

        // Fetch all users with driver or conductor role
        const { data: crew, error } = await supabaseAdmin
            .from('users')
            .select('id, user_id, name, role, status')
            .in('role', ['driver', 'conductor'])
            .eq('status', 'active')
            .order('name', { ascending: true });

        if (error) throw error;

        // Separate into drivers and conductors
        const drivers = crew.filter(c => c.role === 'driver');
        const conductors = crew.filter(c => c.role === 'conductor');

        sendSuccess(res, { drivers, conductors });
    } catch (error) {
        handleError(error, res, 'Failed to fetch crew');
    }
});

/**
 * @route PUT /api/transport/vehicles/:id/crew
 * @desc Assign driver and/or conductor to a vehicle
 */
router.put('/vehicles/:id/crew', async (req, res) => {
    try {
        const { supabaseAdmin } = await import('../common.js');
        const { driver_id, conductor_id } = req.body;

        const updateData = {};
        if (driver_id !== undefined) updateData.current_driver_assigned = driver_id;
        if (conductor_id !== undefined) updateData.conductor_assigned = conductor_id;

        const { data, error } = await supabaseAdmin
            .from('vehicles')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to assign crew to vehicle');
    }
});


/**
 * @route POST /api/transport/pay
 * @desc Process payment for transportation fee installment
 */
router.post('/pay', async (req, res) => {
    try {
        const { payment_id, amount, payment_method, remarks, paid_by } = req.body;
        const context = { user: req.user };

        // 1. Fetch the installment
        const payment = await secureDb.get('transport_fee_payments', q => q.eq('id', payment_id).single());
        if (!payment) return res.status(404).json({ error: 'Payment installment not found' });

        // 2. Validate amount (Basic check)
        const newPaidAmount = (payment.amount_paid || 0) + parseFloat(amount);

        // 3. Update Installment
        const status = newPaidAmount >= payment.amount_due ? 'Paid' : 'Partial';

        await secureDb.update('transport_fee_payments', payment_id, {
            amount_paid: newPaidAmount,
            status: status,
            paid_date: new Date().toISOString()
        }, context);

        // 4. Create Transaction Record (Optional but good for history)
        // Check if transactions table exists or if we should just log it
        // For now, we update the payment record directly.

        sendSuccess(res, { message: 'Payment recorded successfully', status, amount_paid: newPaidAmount });
    } catch (error) {
        handleError(error, res, 'Failed to process payment');
    }
});

/**
 * @route POST /api/transport/fix-fees
 * @desc Backfill fees for existing allocations
 */
router.post('/fix-fees', async (req, res) => {
    try {
        const { supabaseAdmin } = await import('../common.js');
        const context = { user: req.user };

        // 1. Fetch all active registrations linked to students
        const registrations = await secureDb.get('transport_registrations', q => q.eq('status', 'active'));

        let updatedCount = 0;

        for (const reg of registrations) {
            // Check if payments already exist
            const existingPayments = await secureDb.get('transport_fee_payments', q => q.eq('registration_id', reg.id));
            if (existingPayments.length > 0) continue;

            // Determine Fee
            let fee = 0;
            let vehicle = null;

            // Try to find vehicle from registration
            if (reg.vehicle_id) {
                const vs = await secureDb.get('vehicles', q => q.eq('id', reg.vehicle_id));
                vehicle = vs[0];
            }

            // If no vehicle on registration, check route's default vehicle
            if (!vehicle && reg.route_id) {
                // Check route_vehicles first
                const { data: routeVehicles } = await supabaseAdmin
                    .from('transport_route_vehicles')
                    .select('vehicle_id, vehicles(*)')
                    .eq('route_id', reg.route_id);

                if (routeVehicles && routeVehicles.length > 0) {
                    vehicle = routeVehicles[0].vehicles;
                } else {
                    // Check legacy column
                    const routes = await secureDb.get('transport_routes', q => q.eq('id', reg.route_id));
                    if (routes[0]?.vehicle_id) {
                        const vs = await secureDb.get('vehicles', q => q.eq('id', routes[0].vehicle_id));
                        vehicle = vs[0];
                    }
                }
            }

            if (vehicle) {
                const type = vehicle.vehicle_type?.toLowerCase() || '';
                if (type.includes('bus')) fee = 50000;
                else if (type.includes('van')) fee = 40000;
                else if (type.includes('tempo')) fee = 30000;
                else if (type.includes('car')) fee = 20000;
            }

            if (fee > 0) {
                // Update registration with annual fee
                await secureDb.update('transport_registrations', reg.id, { fee_annual: fee }, context);

                // Create Installments
                const semFee = fee / 2;

                // Installment 1
                await secureDb.create('transport_fee_payments', {
                    registration_id: reg.id,
                    installment_no: 1,
                    amount_due: semFee,
                    due_date: new Date().toISOString(),
                    status: 'Pending'
                }, context);

                // Installment 2
                const date2 = new Date();
                date2.setMonth(date2.getMonth() + 6);
                await secureDb.create('transport_fee_payments', {
                    registration_id: reg.id,
                    installment_no: 2,
                    amount_due: semFee,
                    due_date: date2.toISOString(),
                    status: 'Pending'
                }, context);

                updatedCount++;
            }
        }

        sendSuccess(res, { message: `Fixed fees for ${updatedCount} students`, count: updatedCount });
    } catch (error) {
        handleError(error, res, 'Failed to fix fees');
    }
});

export default router;
