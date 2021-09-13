from students import parse_profile, Date


def test_parse_profile():
    alice = parse_profile("alice")
    assert alice.fullname == "Alice Anderson"
    assert alice.dob == Date(2006, 3, 1)
    assert alice.gpa == 3.9

    bob = parse_profile("bob")
    assert bob.fullname == "Bob Brown"
    assert bob.dob == Date(1996, 6, 31)
    assert bob.gpa == 3.8

    charlie = parse_profile("charlie")
    assert charlie.fullname == "Charlie Clark"
    assert charlie.dob == Date(2003, 9, 19)
    assert charlie.gpa == 3.3
