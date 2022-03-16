# Touca vs. Snapshot Testing

Many existing products offer visual regression testing for web applications. But
a large subset of software developed every year is in products that have limited
or no user interface. A common existing solution for testing these products is
snapshot testing, a form of regression testing that stores the output of a given
version of software workflows in snapshot files.

Most snapshot testing libraries leave the comparison and management of these
files to software engineers. Managing result files for hundreds of test cases is
not feasible at scale. Touca manages all submitted test results, compares them
against previous versions, and reports differences in an easy-to-understand
format so that engineers only need to decide what to do with those differences.

Because snapshot files store the overall output of a workflow, they may contain
dynamic data such as timestamps, that can trigger false positives during
comparison. They can miss important information that may not necessarily be
exposed through the software interface. Touca gives you fine-grained control
over what variables and return values to capture as test results. Touca client
libraries preserve the types of your captured data and compare your test results
using their original data type.
