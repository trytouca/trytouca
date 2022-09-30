from datetime import date
from students import find_student


def test_find_student():
    alice = find_student("alice")
    assert alice.fullname == "Alice Anderson"
    assert alice.dob == date(2006, 3, 1)
    assert alice.gpa == 3.9

    bob = find_student("bob")
    assert bob.fullname == "Bob Brown"
    assert bob.dob == date(1996, 6, 30)
    assert bob.gpa == 3.8

    charlie = find_student("charlie")
    assert charlie.fullname == "Charlie Clark"
    assert charlie.dob == date(2003, 9, 19)
    assert charlie.gpa == 3.3
