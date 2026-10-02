using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace PookaKind.Stewart
{
    internal static class HandleResolver
    {
        private static int Main(string[] args)
        {
            if (args.Length == 1 && args[0] == "--self-test") { Console.WriteLine("STEWART_HANDLE_RESOLVER_SELF_TEST_PASS"); return 0; }
            byte[] protectedBytes = null; byte[] plainBytes = null; byte[] entropy = null;
            try
            {
                bool protectFromStandardInput = args.Length == 5 && args[0] == "--protect-stdin" && args[1] == "--handle" && args[3] == "--path";
                bool resolveToStandardOutput = args.Length == 4 && args[0] == "--handle" && args[2] == "--path";
                if (!protectFromStandardInput && !resolveToStandardOutput) throw new InvalidDataException("STEWART_HANDLE_RESOLVER_ARGUMENT_INVALID");
                string handle = args[protectFromStandardInput ? 2 : 1]; string path = Path.GetFullPath(args[protectFromStandardInput ? 4 : 3]);
                if (!Regex.IsMatch(handle, "^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$")) throw new InvalidDataException("STEWART_HANDLE_RESOLVER_HANDLE_INVALID");
                string root = Path.GetFullPath(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PookaKind", "Stewart", "SecretHandles")) + Path.DirectorySeparatorChar;
                if (!path.StartsWith(root, StringComparison.OrdinalIgnoreCase)) throw new InvalidDataException("STEWART_HANDLE_RESOLVER_PATH_INVALID");
                entropy = Encoding.UTF8.GetBytes("Werkles.PookaKind.Stewart.SecretHandle.v1:" + handle);
                if (protectFromStandardInput)
                {
                    if (File.Exists(path) || !Directory.Exists(Path.GetDirectoryName(path))) throw new InvalidDataException("STEWART_HANDLE_RESOLVER_DESTINATION_NOT_CLEAN");
                    Stream input = Console.OpenStandardInput(); byte[] length = new byte[4];
                    if (input.Read(length, 0, length.Length) != length.Length) throw new InvalidDataException("STEWART_HANDLE_RESOLVER_MATERIAL_INVALID");
                    int materialLength = BitConverter.ToInt32(length, 0); Array.Clear(length, 0, length.Length);
                    if (materialLength < 1 || materialLength > 4096) throw new InvalidDataException("STEWART_HANDLE_RESOLVER_MATERIAL_INVALID");
                    plainBytes = new byte[materialLength]; int offset = 0;
                    while (offset < materialLength) { int read = input.Read(plainBytes, offset, materialLength - offset); if (read < 1) throw new InvalidDataException("STEWART_HANDLE_RESOLVER_MATERIAL_INVALID"); offset += read; }
                    if (input.ReadByte() != -1) throw new InvalidDataException("STEWART_HANDLE_RESOLVER_MATERIAL_INVALID");
                    protectedBytes = ProtectedData.Protect(plainBytes, entropy, DataProtectionScope.CurrentUser);
                    using (FileStream file = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None)) { file.Write(protectedBytes, 0, protectedBytes.Length); file.Flush(true); }
                    Console.WriteLine("STEWART_HANDLE_PROTECTED_ONCE");
                    return 0;
                }
                if (!File.Exists(path)) throw new InvalidDataException("STEWART_HANDLE_RESOLVER_PATH_INVALID");
                protectedBytes = File.ReadAllBytes(path);
                plainBytes = ProtectedData.Unprotect(protectedBytes, entropy, DataProtectionScope.CurrentUser);
                if (plainBytes.Length < 1 || plainBytes.Length > 4096) throw new InvalidDataException("STEWART_HANDLE_RESOLVER_MATERIAL_INVALID");
                Stream output = Console.OpenStandardOutput(); byte[] outputLength = BitConverter.GetBytes(plainBytes.Length);
                output.Write(outputLength, 0, outputLength.Length); output.Write(plainBytes, 0, plainBytes.Length); output.Flush(); Array.Clear(outputLength, 0, outputLength.Length);
                return 0;
            }
            catch (Exception error) { Console.Error.WriteLine(error.Message.StartsWith("STEWART_", StringComparison.Ordinal) ? error.Message : "STEWART_HANDLE_RESOLVER_FAILED_CLOSED"); return 1; }
            finally
            {
                if (plainBytes != null) Array.Clear(plainBytes, 0, plainBytes.Length);
                if (protectedBytes != null) Array.Clear(protectedBytes, 0, protectedBytes.Length);
                if (entropy != null) Array.Clear(entropy, 0, entropy.Length);
            }
        }
    }
}
