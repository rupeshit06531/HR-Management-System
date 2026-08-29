from datetime import date, timedelta
from django.contrib.auth import get_user_model
from apps.departments.models import Department, Designation
from apps.employees.models import Employee

User = get_user_model()

employees_data = {
    "IT": [
        ("Amit", "Sharma"),
        ("Priya", "Verma"),
        ("Rohit", "Kumar"),
        ("Neha", "Singh"),
        ("Vikash", "Gupta"),
        ("Anjali", "Sinha"),
        ("Sandeep", "Kumar"),
        ("Pooja", "Mehta"),
        ("Arjun", "Prasad"),
        ("Kavita", "Jha"),
    ],
    "Finance": [
        ("Ankit", "Gupta"),
        ("Sneha", "Sharma"),
        ("Manish", "Kumar"),
        ("Riya", "Singh"),
        ("Deepak", "Verma"),
        ("Nisha", "Sinha"),
        ("Rakesh", "Jha"),
        ("Simran", "Mehta"),
        ("Pankaj", "Prasad"),
        ("Shweta", "Gupta"),
    ],
    "Human Resources": [
        ("Rahul", "Sinha"),
        ("Priyanka", "Kumar"),
        ("Aakash", "Sharma"),
        ("Komal", "Verma"),
        ("Ravi", "Singh"),
        ("Nidhi", "Gupta"),
        ("Manoj", "Jha"),
        ("Swati", "Mehta"),
        ("Abhishek", "Prasad"),
        ("Sakshi", "Kumar"),
    ],
    "Operations": [
        ("Rajesh", "Kumar"),
        ("Monika", "Sharma"),
        ("Sunil", "Verma"),
        ("Poonam", "Singh"),
        ("Ajay", "Gupta"),
        ("Kiran", "Sinha"),
        ("Dinesh", "Jha"),
        ("Rashmi", "Mehta"),
        ("Mohit", "Prasad"),
        ("Divya", "Kumar"),
    ],
    "Sales and Marketing": [
        ("Vivek", "Sharma"),
        ("Ritu", "Kumar"),
        ("Naveen", "Gupta"),
        ("Preeti", "Singh"),
        ("Ashish", "Verma"),
        ("Meena", "Sinha"),
        ("Gaurav", "Jha"),
        ("Jyoti", "Mehta"),
        ("Kunal", "Prasad"),
        ("Muskan", "Kumar"),
    ],
}

designation_map = {
    "IT": "Software Developer",
    "Finance": "Accountant",
    "Human Resources": "HR Executive",
    "Operations": "Operations Executive",
    "Sales and Marketing": "Sales Executive",
}

password = "Test@1234"

created = 0
skipped = 0

for department_name, people in employees_data.items():

    department = Department.objects.get(
        name=department_name
    )

    designation = Designation.objects.get(
        department=department,
        name=designation_map[department_name],
    )

    for index, (first_name, last_name) in enumerate(people, start=1):

        employee_number = (
            f"{department.id}{index:02d}"
        )

        employee_id = f"EMP-{employee_number}"

        username = (
            f"{first_name.lower()}.{last_name.lower()}"
            f"{department.id}{index}"
        )

        email = f"{username}@hrms.local"

        if Employee.objects.filter(
            employee_id=employee_id
        ).exists():
            skipped += 1
            continue

        if User.objects.filter(
            username=username
        ).exists():
            skipped += 1
            continue

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=User.Role.EMPLOYEE,
            employee_id=employee_id,
            is_active=True,
        )

        employee = Employee.objects.create(
            user=user,
            employee_id=employee_id,
            department=department,
            designation=designation,
            joining_date=date.today()
            - timedelta(days=180 + (index * 45)),
            employment_type=Employee.EmploymentType.FULL_TIME,
            employment_status=Employee.EmploymentStatus.ACTIVE,
        )

        created += 1

print()
print("=" * 50)
print("EMPLOYEE SEED COMPLETED")
print("=" * 50)
print(f"Created : {created}")
print(f"Skipped : {skipped}")
print(f"Total employees : {Employee.objects.count()}")
print(f"Total users : {User.objects.count()}")
print()
print(f"Test password for generated employees: {password}")
print("=" * 50)
