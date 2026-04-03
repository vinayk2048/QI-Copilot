from test_case_generator import TestCaseGenerator
from script_generator import ScriptGenerator
from file_writer import FileWriter


def generate_test_cases_flow():
    user_story = input("\nEnter User Story:\n")

    tc_generator = TestCaseGenerator()
    test_cases = tc_generator.generate_test_cases(user_story)

    print("\n===== Generated Test Cases =====\n")
    print(test_cases)

    FileWriter.save_test_cases(test_cases)


def generate_script_flow():
    print("\nSelect Framework:")
    print("1. Selenium")
    print("2. Playwright")
    print("3. Cypress")
    print("4. RestAssured")

    framework_choice = input("Enter choice number: ")

    framework_map = {
        "1": "Selenium",
        "2": "Playwright",
        "3": "Cypress",
        "4": "RestAssured"
    }

    framework = framework_map.get(framework_choice, "Selenium")

    language = input("\nEnter Programming Language (Java/Python/JavaScript): ")

    test_cases = FileWriter.read_test_cases_from_file()

    if not test_cases:
        print("No generated test case file found. Please generate test cases first.")
        return

    print("\nUsing latest generated test cases for script generation...")

    script_generator = ScriptGenerator()
    script = script_generator.generate_script(test_cases, framework, language)

    print("\n===== Generated Automation Script =====\n")
    print(script)

    FileWriter.save_script(script, language)


def main():
    print("===== AI Test Automation Engine =====")
    print("1. Generate Test Cases")
    print("2. Generate Automation Script")

    choice = input("Select option: ")

    if choice == "1":
        generate_test_cases_flow()
    elif choice == "2":
        generate_script_flow()
    else:
        print("Invalid choice")


if __name__ == "__main__":
    main()