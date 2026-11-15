import unittest

from app import safe_command, vulnerable_command


class CommandInjectionLabTests(unittest.TestCase):
    def test_vulnerable_variant_runs_harmless_injected_echo(self) -> None:
        output = vulnerable_command("hello & echo INJECTED")
        
       
        if "hello" in output and "INJECTED" in output:
            print("\n[PASS] Vulnerable variant executed the injected command successfully.")
        else:
            self.fail(f"[FAIL] Injected command was not executed. Output: {output}")

    def test_safe_variant_treats_same_payload_as_literal_data(self) -> None:
        payload = "hello & echo INJECTED"
        output = safe_command(payload)
        
        
        if output == payload:
            print("[PASS] Safe variant treated payload as literal text data.")
        else:
            self.fail(f"[FAIL] Safe variant failed to mitigate injection. Output: {output}")


if __name__ == "__main__":
    unittest.main()
