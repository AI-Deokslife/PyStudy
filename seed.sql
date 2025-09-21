-- 기본 관리자 계정 생성 (비밀번호: admin123) - 평문 저장
INSERT OR IGNORE INTO users (username, password_hash, full_name, role) VALUES 
  ('admin', 'admin123', '시스템 관리자', 'admin');

-- 기본 교사 계정 생성 (비밀번호: teacher123) - 평문 저장
INSERT OR IGNORE INTO users (username, password_hash, full_name, role, email) VALUES 
  ('teacher1', 'teacher123', '이은덕 선생님', 'teacher', 'teacher1@school.edu');

-- 기본 클래스 생성
INSERT OR IGNORE INTO classes (id, name, description, teacher_id) VALUES 
  ('CS101', '파이썬 기초', '파이썬 프로그래밍 기초 과정', 2);

-- 테스트 학생 계정 생성 (비밀번호: student123) - 평문 저장
INSERT OR IGNORE INTO users (username, password_hash, full_name, role, class_id) VALUES 
  ('student1', 'student123', '김학생', 'student', 'CS101'),
  ('student2', 'student123', '박학생', 'student', 'CS101'),
  ('student3', 'student123', '최학생', 'student', 'CS101');

-- 기본 문제 생성
INSERT OR IGNORE INTO problems (title, description, initial_code, expected_output, test_cases, created_by) VALUES 
  ('Hello World', '파이썬으로 "Hello, World!"를 출력하는 프로그램을 작성하세요.', 'print("Hello, World!")', 'Hello, World!', '[]', 2),
  ('변수와 입력', '이름을 입력받아 "안녕하세요, [이름]님!"을 출력하는 프로그램을 작성하세요.', 'name = input("이름을 입력하세요: ")\nprint(f"안녕하세요, {name}님!")', '안녕하세요, 홍길동님!', '[{"input": "홍길동", "output": "안녕하세요, 홍길동님!"}]', 2),
  ('반복문', '1부터 5까지의 숫자를 출력하는 프로그램을 작성하세요.', 'for i in range(1, 6):\n    print(i)', '1\n2\n3\n4\n5', '[]', 2);