-- 제출 기록 삭제 요청 테이블
CREATE TABLE IF NOT EXISTS submission_deletion_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  student_username TEXT NOT NULL,
  student_name TEXT NOT NULL,
  reason TEXT,
  request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  teacher_id INTEGER,
  teacher_response TEXT,
  response_date DATETIME,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_deletion_requests_student_id ON submission_deletion_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON submission_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_submission_id ON submission_deletion_requests(submission_id);