export interface CloudflareBindings {
  DB: D1Database;
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  email?: string;
  role: 'admin' | 'teacher' | 'student';
  class_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  description?: string;
  teacher_id: number;
  created_at: string;
}

export interface Problem {
  id: number;
  title: string;
  description: string;
  initial_code?: string;
  expected_output?: string;
  test_cases: TestCase[];
  time_limit: number;
  memory_limit: number;
  difficulty: 'easy' | 'medium' | 'hard';
  created_by: number;
  created_at: string;
}

export interface TestCase {
  input?: string;
  output: string;
  description?: string;
}

export interface ProblemSession {
  id: number;
  problem_id: number;
  class_id: string;
  teacher_id: number;
  title: string;
  status: 'active' | 'ended';
  start_time: string;
  end_time?: string;
  problem?: Problem;
}

export interface Submission {
  id: number;
  session_id: number;
  student_id: number;
  code: string;
  output?: string;
  error_message?: string;
  execution_time?: number;
  status: 'pending' | 'success' | 'error' | 'timeout';
  submitted_at: string;
  student?: User;
}

export interface JWTPayload {
  userId: number;
  username: string;
  role: 'admin' | 'teacher' | 'student';
  classId?: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  full_name: string;
  email?: string;
  role: 'admin' | 'teacher' | 'student';
  class_id?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface CreateProblemRequest {
  title: string;
  description: string;
  initial_code?: string;
  expected_output?: string;
  test_cases: TestCase[];
  time_limit?: number;
  memory_limit?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface CreateSessionRequest {
  problem_id: number;
  class_id: string;
  title: string;
}

export interface SubmitCodeRequest {
  session_id: number;
  code: string;
}

export interface ExecuteCodeRequest {
  code: string;
}

export interface ExecuteCodeResponse {
  output?: string;
  error?: string;
  execution_time?: number;
  status: 'success' | 'error' | 'timeout';
}