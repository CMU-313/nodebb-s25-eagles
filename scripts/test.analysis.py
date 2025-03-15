import unittest

# Discover and run all tests in the current directory and subdirectories
if __name__ == '__main__':
    loader = unittest.TestLoader()
    tests = loader.discover(start_dir='.', pattern='test_*.py')
    testRunner = unittest.TextTestRunner()
    testRunner.run(tests)