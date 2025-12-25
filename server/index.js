import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://vzkbyzpqnojhlazwopvz.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6a2J5enBxbm9qaGxhendvcHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTk2MTMsImV4cCI6MjA4MTc5NTYxM30.ledQxA84HlYEQyUTmp2VJ7U4lRkLMqKCYieQNL_ObuY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend API is running' });
});

// ==================== USERS ENDPOINTS ====================

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const { role, status, department_id, org_id, user_id, email } = req.query;
    
    let query = supabase.from('users').select('*');
    
    if (role) query = query.eq('role', role);
    if (status) query = query.eq('status', status);
    if (department_id) query = query.eq('department_id', department_id);
    if (org_id) query = query.eq('org_id', org_id);
    if (user_id) query = query.eq('user_id', user_id);
    if (email) query = query.eq('email', email);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ data, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    res.json({ data, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Get users by department IDs
app.post('/api/users/by-departments', async (req, res) => {
  try {
    const { department_ids, role, status } = req.body;
    
    let query = supabase.from('users').select('*');
    
    if (department_ids && department_ids.length > 0) {
      query = query.in('department_id', department_ids);
    }
    if (role) query = query.eq('role', role);
    if (status) query = query.eq('status', status);
    
    const { data, error } = await query.order('name', { ascending: true });
    
    if (error) throw error;
    res.json({ data, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert(req.body)
      .select()
      .single();
    
    if (error) throw error;
    res.json({ data, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    res.json({ data, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('users')
      .eq('id', req.params.id)
      .delete();
    
    if (error) throw error;
    res.json({ data: { success: true }, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// ==================== ORGANIZATIONS ENDPOINTS ====================

app.get('/api/organizations', async (req, res) => {
  try {
    const { org_name, id } = req.query;
    let query = supabase.from('organizations').select('*');
    
    if (org_name) query = query.eq('org_name', org_name);
    if (id) query = query.eq('id', id);
    
    const { data, error } = await query;
    if (error) {
      console.error('Organizations query error:', error);
      throw error;
    }
    res.json({ data: data || [], error: null });
  } catch (error) {
    console.error('Organizations endpoint error:', error);
    res.status(500).json({ data: null, error: error.message || 'Internal server error' });
  }
});

// ==================== DEPARTMENTS ENDPOINTS ====================

app.get('/api/departments', async (req, res) => {
  try {
    const { id, ids } = req.query;
    let query = supabase.from('departments').select('*');
    
    if (id) query = query.eq('id', id);
    if (ids) {
      const idArray = Array.isArray(ids) ? ids : ids.split(',');
      query = query.in('id', idArray);
    }
    
    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    res.json({ data, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

app.post('/api/departments', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .insert(req.body)
      .select()
      .single();
    
    if (error) throw error;
    res.json({ data, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// ==================== TEACHER DEPARTMENTS ENDPOINTS ====================

app.get('/api/teacher-departments/:teacherId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('teacher_departments')
      .select('*')
      .eq('teacher_id', req.params.teacherId);
    
    if (error) throw error;
    res.json({ data, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

app.post('/api/teacher-departments', async (req, res) => {
  try {
    const { teacher_id, department_ids } = req.body;
    
    // Delete existing associations
    await supabase
      .from('teacher_departments')
      .delete()
      .eq('teacher_id', teacher_id);
    
    // Insert new associations
    const records = department_ids.map((deptId) => ({
      teacher_id,
      department_id: deptId,
    }));
    
    const { data, error } = await supabase
      .from('teacher_departments')
      .insert(records)
      .select();
    
    if (error) throw error;
    res.json({ data, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// ==================== ATTENDANCE ENDPOINTS ====================

app.get('/api/attendance', async (req, res) => {
  try {
    const { date, student_id, student_ids } = req.query;
    let query = supabase.from('attendance').select('*');
    
    if (date) query = query.eq('date', date);
    if (student_id) query = query.eq('student_id', student_id);
    if (student_ids) {
      const idArray = Array.isArray(student_ids) ? student_ids : student_ids.split(',');
      query = query.in('student_id', idArray);
    }
    
    const { data, error } = await query.order('date', { ascending: true });
    if (error) throw error;
    res.json({ data, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const records = Array.isArray(req.body) ? req.body : [req.body];
    const { data, error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'student_id,date' })
      .select();
    
    if (error) throw error;
    res.json({ data, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// ==================== NOTIFICATIONS ENDPOINTS ====================

app.get('/api/notifications', async (req, res) => {
  try {
    const { user_id, read, limit } = req.query;
    let query = supabase.from('notifications').select('*');
    
    if (user_id) query = query.eq('user_id', user_id);
    if (read !== undefined) query = query.eq('read', read === 'true');
    
    query = query.order('created_at', { ascending: false });
    if (limit) query = query.limit(parseInt(limit));
    
    const { data, error } = await query;
    if (error) throw error;
    res.json({ data, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(req.body)
      .select()
      .single();
    
    if (error) throw error;
    res.json({ data, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    res.json({ data, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

app.put('/api/notifications/read-all', async (req, res) => {
  try {
    const { user_id } = req.body;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user_id)
      .eq('read', false);
    
    if (error) throw error;
    res.json({ data: { success: true }, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// ==================== ACTIVITIES ENDPOINTS ====================

app.get('/api/activities', async (req, res) => {
  try {
    const { limit } = req.query;
    let query = supabase.from('activities').select('*');
    
    query = query.order('created_at', { ascending: false });
    if (limit) query = query.limit(parseInt(limit));
    
    const { data, error } = await query;
    if (error) throw error;
    res.json({ data, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

app.post('/api/activities', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert(req.body)
      .select()
      .single();
    
    if (error) throw error;
    res.json({ data, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ data: null, error: err.message || 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ data: null, error: `Route ${req.method} ${req.path} not found` });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});

