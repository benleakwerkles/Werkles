using System;
using System.IO;
using System.Security.AccessControl;
using System.Security.Cryptography;
using System.Security.Principal;
using System.Text;

namespace PookaKind.Stewart
{
    internal static class LegacyBlindImporter
    {
        private const string Handle = "blind-master";
        private static readonly UTF8Encoding Utf8 = new UTF8Encoding(false, true);
        private static readonly UnicodeEncoding Utf16 = new UnicodeEncoding(false, false, true);

        private static string Root()
        {
            return Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        }

        private static string Source()
        {
            return Path.Combine(Root(), "WerklesPasswordProject", "BrainPassSecrets", "HumanGateBrainPass.dpapi.txt");
        }

        private static string DestinationDirectory()
        {
            return Path.Combine(Root(), "PookaKind", "Stewart", "SecretHandles");
        }

        private static byte[] DecodeHex(string input)
        {
            string hex = input.Trim();
            if (hex.Length < 2 || hex.Length > 16384 || (hex.Length & 1) != 0) throw new InvalidDataException("STEWART_LEGACY_SOURCE_INVALID");
            byte[] output = new byte[hex.Length / 2];
            for (int index = 0; index < output.Length; index++)
            {
                int high = HexDigit(hex[index * 2]);
                int low = HexDigit(hex[index * 2 + 1]);
                if (high < 0 || low < 0) throw new InvalidDataException("STEWART_LEGACY_SOURCE_INVALID");
                output[index] = (byte)((high << 4) | low);
            }
            return output;
        }

        private static int HexDigit(char value)
        {
            if (value >= '0' && value <= '9') return value - '0';
            if (value >= 'a' && value <= 'f') return value - 'a' + 10;
            if (value >= 'A' && value <= 'F') return value - 'A' + 10;
            return -1;
        }

        private static byte[] ConvertLegacy(byte[] legacyCipher, byte[] entropy)
        {
            byte[] utf16 = null;
            byte[] utf8 = null;
            try
            {
                utf16 = ProtectedData.Unprotect(legacyCipher, null, DataProtectionScope.CurrentUser);
                if (utf16.Length < 2 || utf16.Length > 8192 || (utf16.Length & 1) != 0) throw new InvalidDataException("STEWART_LEGACY_MATERIAL_INVALID");
                utf8 = Encoding.Convert(Utf16, Utf8, utf16);
                if (utf8.Length < 1 || utf8.Length > 4096) throw new InvalidDataException("STEWART_LEGACY_MATERIAL_INVALID");
                return ProtectedData.Protect(utf8, entropy, DataProtectionScope.CurrentUser);
            }
            finally
            {
                if (utf16 != null) Array.Clear(utf16, 0, utf16.Length);
                if (utf8 != null) Array.Clear(utf8, 0, utf8.Length);
            }
        }

        private static void EnsurePrivateDirectory(string path)
        {
            SecurityIdentifier current = WindowsIdentity.GetCurrent().User;
            DirectorySecurity acl = new DirectorySecurity();
            acl.SetAccessRuleProtection(true, false);
            acl.AddAccessRule(new FileSystemAccessRule(current, FileSystemRights.FullControl,
                InheritanceFlags.ContainerInherit | InheritanceFlags.ObjectInherit,
                PropagationFlags.None, AccessControlType.Allow));
            if (!Directory.Exists(path)) Directory.CreateDirectory(path, acl);
            else new DirectoryInfo(path).SetAccessControl(acl);
        }

        private static int SelfTest()
        {
            byte[] secret = Utf16.GetBytes("synthetic-only-\u2713");
            byte[] legacy = null;
            byte[] converted = null;
            byte[] restored = null;
            byte[] entropy = Utf8.GetBytes("Werkles.PookaKind.Stewart.SecretHandle.v1:" + Handle);
            try
            {
                legacy = ProtectedData.Protect(secret, null, DataProtectionScope.CurrentUser);
                converted = ConvertLegacy(legacy, entropy);
                restored = ProtectedData.Unprotect(converted, entropy, DataProtectionScope.CurrentUser);
                if (!String.Equals(Utf8.GetString(restored), "synthetic-only-\u2713", StringComparison.Ordinal)) throw new InvalidDataException("STEWART_LEGACY_SELF_TEST_FAILED");
                if (DecodeHex("0A1b").Length != 2) throw new InvalidDataException("STEWART_LEGACY_SELF_TEST_FAILED");
                try { DecodeHex("0A1x"); throw new InvalidDataException("STEWART_LEGACY_SELF_TEST_FAILED"); }
                catch (InvalidDataException error) { if (error.Message != "STEWART_LEGACY_SOURCE_INVALID") throw; }
                Console.WriteLine("STEWART_LEGACY_IMPORTER_SELF_TEST_PASS");
                return 0;
            }
            finally
            {
                Array.Clear(secret, 0, secret.Length);
                Array.Clear(entropy, 0, entropy.Length);
                if (legacy != null) Array.Clear(legacy, 0, legacy.Length);
                if (converted != null) Array.Clear(converted, 0, converted.Length);
                if (restored != null) Array.Clear(restored, 0, restored.Length);
            }
        }

        private static int Main(string[] args)
        {
            if (args.Length == 1 && args[0] == "--self-test") return SelfTest();
            if (args.Length == 1 && args[0] == "--probe")
            {
                Console.WriteLine("STEWART_LEGACY_SOURCE_" + (File.Exists(Source()) ? "PRESENT" : "MISSING"));
                Console.WriteLine("STEWART_BLIND_DESTINATION_" + (File.Exists(Path.Combine(DestinationDirectory(), Handle + ".dpapi")) ? "PRESENT" : "MISSING"));
                return 0;
            }
            bool verify = args.Length == 1 && args[0] == "--verify-match";
            if (!verify && (args.Length != 1 || args[0] != "--import-once")) { Console.Error.WriteLine("STEWART_LEGACY_ARGUMENT_INVALID"); return 1; }
            byte[] legacy = null;
            byte[] entropy = null;
            byte[] converted = null;
            byte[] oldMaterial = null;
            byte[] expected = null;
            byte[] current = null;
            try
            {
                string source = Source();
                string directory = DestinationDirectory();
                string destination = Path.Combine(directory, Handle + ".dpapi");
                if (!File.Exists(source)) throw new InvalidDataException("STEWART_LEGACY_SOURCE_MISSING");
                legacy = DecodeHex(File.ReadAllText(source, Encoding.ASCII));
                entropy = Utf8.GetBytes("Werkles.PookaKind.Stewart.SecretHandle.v1:" + Handle);
                if (verify)
                {
                    if (!File.Exists(destination)) throw new InvalidDataException("STEWART_LEGACY_DESTINATION_MISSING");
                    oldMaterial = ProtectedData.Unprotect(legacy, null, DataProtectionScope.CurrentUser);
                    if (oldMaterial.Length < 2 || oldMaterial.Length > 8192 || (oldMaterial.Length & 1) != 0) throw new InvalidDataException("STEWART_LEGACY_MATERIAL_INVALID");
                    expected = Encoding.Convert(Utf16, Utf8, oldMaterial);
                    current = ProtectedData.Unprotect(File.ReadAllBytes(destination), entropy, DataProtectionScope.CurrentUser);
                    if (expected.Length < 1 || expected.Length > 4096 || current.Length != expected.Length) throw new InvalidDataException("STEWART_LEGACY_DESTINATION_MISMATCH");
                    int mismatch = 0;
                    for (int index = 0; index < expected.Length; index++) mismatch |= expected[index] ^ current[index];
                    if (mismatch != 0) throw new InvalidDataException("STEWART_LEGACY_DESTINATION_MISMATCH");
                    Console.WriteLine("STEWART_LEGACY_BLIND_HANDLE_MATCH_VERIFIED");
                    return 0;
                }
                if (File.Exists(destination)) throw new InvalidDataException("STEWART_LEGACY_DESTINATION_EXISTS");
                converted = ConvertLegacy(legacy, entropy);
                EnsurePrivateDirectory(directory);
                using (FileStream output = new FileStream(destination, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                {
                    output.Write(converted, 0, converted.Length);
                    output.Flush(true);
                }
                Console.WriteLine("STEWART_LEGACY_BLIND_HANDLE_IMPORTED_ONCE");
                return 0;
            }
            catch (Exception error)
            {
                Console.Error.WriteLine(error is InvalidDataException && error.Message.StartsWith("STEWART_LEGACY_", StringComparison.Ordinal)
                    ? error.Message : "STEWART_LEGACY_IMPORT_FAILED_CLOSED");
                return 1;
            }
            finally
            {
                if (legacy != null) Array.Clear(legacy, 0, legacy.Length);
                if (entropy != null) Array.Clear(entropy, 0, entropy.Length);
                if (converted != null) Array.Clear(converted, 0, converted.Length);
                if (oldMaterial != null) Array.Clear(oldMaterial, 0, oldMaterial.Length);
                if (expected != null) Array.Clear(expected, 0, expected.Length);
                if (current != null) Array.Clear(current, 0, current.Length);
            }
        }
    }
}
