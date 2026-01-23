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

        // Loop through routes to attach stops and vehicle
        const enrichedRoutes = await Promise.all(routes.map(async (route) => {
            const stops = await secureDb.get('transport_stops', q => q.eq('route_id', route.id).order('stop_order'));
            let vehicle = null;
            if (route.vehicle_id) {
                const vehicles = await secureDb.get('transport_vehicles', q => q.eq('id', route.vehicle_id));
                vehicle = vehicles[0] || null;
            }
            return { ...route, stops, vehicle };
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
            reg_date: new Date().toISOString()
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

export default router;
