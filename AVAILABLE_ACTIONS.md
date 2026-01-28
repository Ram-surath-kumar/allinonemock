# Available Application Actions

This document lists all registered actions within the **SchoolSphere Admin** application. These actions are available via the Global Search and the AI Chatbot (Slash Commands).

> **Note for Testers:** This list covers all actions centralized in the Action Registry. Some specific UI interactions (like clicking buttons inside complex forms) may not be listed here if they are not exposed to the global search system.

## Dashboard & General
| Action ID | Title | Description | Keywords |
| :--- | :--- | :--- | :--- |
| `dashboard.view` | Dashboard | View statistics, analytics, and overview | dashboard, home, stats, analytics, overview |
| `notifications.view` | Notifications | View system notifications and alerts | notifications, alerts, messages, warnings |

## User Management
| Action ID | Title | Description | Keywords |
| :--- | :--- | :--- | :--- |
| `users.view` | User Management | View and manage all system users | users, staff, accounts, people |
| `users.add` | Add New User | Create a new user account (Student, Teacher, Staff) | add user, create user, new user, register user |
| `users.add_ai` | Add User with AI | Extract user data from images or text | ai user, scan user, upload user, extract user |
| `users.import` | Bulk Import Users | Import multiple users via CSV/Excel | bulk import, import users, upload csv |

## Students
| Action ID | Title | Description | Keywords |
| :--- | :--- | :--- | :--- |
| `students.view` | Student List | View and filter all student records | students, pupils, class list, search student |
| `students.add` | Add Student | Register a new student individually | add student, new student, enroll student |
| `students.attendance_view` | View Student Attendance | Check attendance records for students | student attendance, attendance history, check presence |

## Attendance
| Action ID | Title | Description | Keywords |
| :--- | :--- | :--- | :--- |
| `attendance.mark` | Mark Attendance | Record daily attendance for classes | mark attendance, take attendance, roll call, present, absent |
| `attendance.report` | Attendance Report | View consolidated attendance reports | attendance report, attendance analytics, monthly attendance |

## Finance
| Action ID | Title | Description | Keywords |
| :--- | :--- | :--- | :--- |
| `finance.dashboard` | Finance Dashboard | Financial overview, earnings, and expenses | finance, money, accounts, revenue, budget |
| `finance.collect_fee` | Collect Fee Payment | Record a fee payment from a student | collect fee, pay fee, payment, receive money |
| `finance.expenses` | Manage Expenses | Track and record school expenses | expenses, spending, bills, add expense |
| `finance.reports` | Financial Reports | View balance sheets and profit/loss | finance report, balance sheet, income statement |

## Admissions
| Action ID | Title | Description | Keywords |
| :--- | :--- | :--- | :--- |
| `admissions.view` | Admissions Dashboard | Manage applications and inquiries | admissions, applications, inquiries, applicants |
| `admissions.add_applicant` | New Application | Create a new admission application | add applicant, new application, register applicant |

## Academics & Governance
| Action ID | Title | Description | Keywords |
| :--- | :--- | :--- | :--- |
| `academics.view` | Academic Governance | Manage courses, subjects, and batches | academics, courses, subjects, curriculum, syllabus |
| `timetable.view` | Timetable / Schedule | View and manage class schedules | timetable, schedule, classes, periods |
| `mis.view` | MIS & Compliance | Generate AICTE, UGC, and NIRF reports | mis, compliance, aicte, nirf, ugc, government reports |

## Facilities & Hostel
| Action ID | Title | Description | Keywords |
| :--- | :--- | :--- | :--- |
| `facilities.view` | Facilities Management | Manage rooms, buildings, and assets | facilities, rooms, buildings, assets, infrastructure |
| `hostel.view` | Hostel Management | Manage hostels, rooms, and allocations | hostel, dormitory, rooms, beds, warden |
| `hostel.add` | Add Hostel | Register a new hostel building | add hostel, new hostel, create hostel |
| `hostel.allocate` | Allocate Room | Allocate hostel room to a student | allocate room, assign room, hostel admission |
| `facilities.add_room` | Add Room | Register a new room or facility | add room, create room, new classroom |
| `facilities.transport` | Transport Management | Manage vehicles, routes, and drivers | transport, bus, vehicles, drivers, routes |

## Library
| Action ID | Title | Description | Keywords |
| :--- | :--- | :--- | :--- |
| `library.view` | Library Management | Manage books, issues, and returns | library, books, issue book, return book |
| `library.add_book` | Add Book | Register a new book in the library | add book, new book, catalog book |

## Examinations
| Action ID | Title | Description | Keywords |
| :--- | :--- | :--- | :--- |
| `exams.view` | Examinations | Manage exams, schedules, and results | exams, tests, results, marks, grading |
| `exams.schedule` | Schedule Exam | Create a new examination schedule | schedule exam, new exam, create test |

## Tools & Settings
| Action ID | Title | Description | Keywords |
| :--- | :--- | :--- | :--- |
| `tools.view` | Admin Tools | System utilities and configuration | tools, admin, utilities, config |
| `settings.view` | Settings | Application preferences and setup | settings, preferences, config, setup |
| `settings.roles` | Role Management | Manage user roles and permissions | roles, permissions, access, acl |

## Student Portal (Specific)
| Action ID | Title | Description | Keywords |
| :--- | :--- | :--- | :--- |
| `student.profile` | My Profile | View and edit personal details | my profile, my details, personal info |
| `student.grades` | My Grades & Marks | View academic performance | my grades, my marks, results, report card |
| `student.timetable` | My Timetable | View class schedule | my timetable, my schedule, classes |
| `student.fees` | Pay Fees | View and pay pending fees | pay fees, my fees, dues |
