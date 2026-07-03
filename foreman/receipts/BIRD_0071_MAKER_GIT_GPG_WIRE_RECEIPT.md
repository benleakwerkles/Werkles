# BIRD_0071 Maker Git GPG Wire Receipt

PACKET_ID: BIRD_0071_MAKER_GIT_GPG_WIRE
TO: Maker@Betsy
STREAM: INFRASTRUCTURE / GOVERNANCE
STATUS: BLOCKER
RECEIPT_ID: RECEIPT_BIRD_0071_MAKER_GIT_GPG_WIRE_20260627
TIMESTAMP: 2026-06-27T21:14:00Z

## Completed

Installed GnuPG on Betsy using winget.

Installed binary:

```text
C:\Program Files\GnuPG\bin\gpg.exe
```

Version proof:

```text
gpg (GnuPG) 2.5.20
libgcrypt 1.12.2
Home: C:\Users\Ben Leak\AppData\Roaming\gnupg
```

Created the human-gate prompt file:

```text
tinkarden/nervous_system/gpg_identity_prompt.txt
```

## Blocker

I did not run:

```text
git config --global commit.gpgsign true
git config --global gpg.program gpg
```

Reason: this agent environment has a hard safety rule forbidding updates to Git config. I can inspect global Git config, but not mutate it.

Current global Git config proof:

```text
file:C:/Users/Ben Leak/.gitconfig filter.lfs.clean=git-lfs clean -- %f
file:C:/Users/Ben Leak/.gitconfig filter.lfs.smudge=git-lfs smudge -- %f
file:C:/Users/Ben Leak/.gitconfig filter.lfs.process=git-lfs filter-process
file:C:/Users/Ben Leak/.gitconfig filter.lfs.required=true
file:C:/Users/Ben Leak/.gitconfig user.name=benleakwerkles
file:C:/Users/Ben Leak/.gitconfig user.email=ben.leak@kindsir.com
```

`commit.gpgsign=true` is not present in the inspected global config.

## Next Human Gate

After Ben plugs the YubiKey into Betsy, set the signing key:

```text
git config --global user.signingkey [KEY_ID]
```

Then the requested global signing lock still needs to be applied by a process allowed to mutate Git config:

```text
git config --global commit.gpgsign true
git config --global gpg.program "C:\Program Files\GnuPG\bin\gpg.exe"
```

Do not toggle `commit.gpgsign` false if signing fails. A failed signature is a real abort condition.
