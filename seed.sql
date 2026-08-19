-- Seed data for 5th Semester Courses
INSERT INTO courses (id, code, name, credit_hours, department) VALUES
('c0000000-0000-0000-0000-000000000101', 'CSE 3101', 'Computer Graphics', 3.0, 'CSE'),
('c0000000-0000-0000-0000-000000000102', 'CSE 3102', 'Computer Graphics Lab', 1.0, 'CSE'),
('c0000000-0000-0000-0000-000000000103', 'CSE 3103', 'Database Management System', 3.0, 'CSE'),
('c0000000-0000-0000-0000-000000000104', 'CSE 3104', 'Database Management System Lab', 1.5, 'CSE'),
('c0000000-0000-0000-0000-000000000105', 'CSE 3105', 'Computer Architecture', 3.0, 'CSE'),
('c0000000-0000-0000-0000-000000000106', 'CSE 3106', 'Computer Architecture Lab', 1.0, 'CSE'),
('c0000000-0000-0000-0000-000000000107', 'CSE 3107', 'Communication Engineering', 3.0, 'CSE'),
('c0000000-0000-0000-0000-000000003141', 'MAT 3141', 'Applied Statistics and Probability', 3.0, 'CSE')
ON CONFLICT (id) DO NOTHING;

-- Seed data for 5th Semester Section B Class Routine
INSERT INTO class_routine_entries (department, batch, section, semester, course_id, day_of_week, start_time, end_time, room) VALUES
-- Sunday
('CSE', 'Fall 2023', 'B', '5th', 'c0000000-0000-0000-0000-000000003141', 'Sunday', '12:15:00', '13:15:00', '514'),
('CSE', 'Fall 2023', 'B', '5th', 'c0000000-0000-0000-0000-000000000105', 'Sunday', '13:50:00', '14:55:00', '313'),
('CSE', 'Fall 2023', 'B', '5th', 'c0000000-0000-0000-0000-000000000101', 'Sunday', '14:55:00', '16:00:00', '313'),

-- Monday
('CSE', 'Fall 2023', 'B', '5th', 'c0000000-0000-0000-0000-000000000103', 'Monday', '09:00:00', '10:05:00', '411'),
('CSE', 'Fall 2023', 'B', '5th', 'c0000000-0000-0000-0000-000000000106', 'Monday', '10:05:00', '11:10:00', '127 EEL'),

-- Tuesday
('CSE', 'Fall 2023', 'B', '5th', 'c0000000-0000-0000-0000-000000003141', 'Tuesday', '09:00:00', '10:05:00', '313'),
('CSE', 'Fall 2023', 'B', '5th', 'c0000000-0000-0000-0000-000000000103', 'Tuesday', '11:10:00', '12:15:00', '413'),
('CSE', 'Fall 2023', 'B', '5th', 'c0000000-0000-0000-0000-000000000102', 'Tuesday', '12:15:00', '13:15:00', '104 CNL'),

-- Wednesday
('CSE', 'Fall 2023', 'B', '5th', 'c0000000-0000-0000-0000-000000000107', 'Wednesday', '09:00:00', '10:05:00', '314'),
('CSE', 'Fall 2023', 'B', '5th', 'c0000000-0000-0000-0000-000000000101', 'Wednesday', '10:05:00', '11:10:00', '413'),
('CSE', 'Fall 2023', 'B', '5th', 'c0000000-0000-0000-0000-000000000105', 'Wednesday', '11:10:00', '12:15:00', '413'),

-- Thursday
('CSE', 'Fall 2023', 'B', '5th', 'c0000000-0000-0000-0000-000000000104', 'Thursday', '09:00:00', '11:10:00', '103 DMSL'),
('CSE', 'Fall 2023', 'B', '5th', 'c0000000-0000-0000-0000-000000000107', 'Thursday', '11:10:00', '12:15:00', '912');
