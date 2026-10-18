# Acquiring timestamped captions

Prefer an available transcript tool or accessible transcript supplied by the
user, retaining timestamps and provenance. Check what the host actually offers;
do not assume a YouTube transcript MCP or speech service exists.

For public captions, `yt-dlp` is an optional local tool. Check availability
with `command -v yt-dlp`. If missing, disclose the missing dependency and use
an available transcript route. Follow native permissions for any installation;
do not change global tools or install a transcription service implicitly.

## Version and runtime

yt-dlp has stable, nightly and master channels, not an LTS branch. Prefer the
current stable release for this project's conservative setup; check official
releases and security advisories before claiming it is up to date or safe.
Never treat a version check as a guarantee of no vulnerabilities.

On 2026-10-16, the local uv-managed installation was stable `2026.08.19`,
matching GitHub's latest non-prerelease. Its 1,049 installed package files and
the six files in `yt-dlp-ejs 0.8.0` matched their official PyPI wheels byte for
byte. The published yt-dlp advisories read at that date had patched versions
older than this installation. This check does not cover every transitive
dependency, the Python/Node runtime or future advisories.

Use the installed supported Node runtime for the EJS solver in this setup.
This is a third-party runtime exception to the Bun-only application workflow:
the installed Bun 1.4.0 exceeds yt-dlp's supported Bun range. Node 24.19.0 was
available locally. Recheck current requirements in the
[EJS guide](https://github.com/yt-dlp/yt-dlp/wiki/EJS) when the setup changes.
The uv installation includes `yt-dlp-ejs`; remote component downloads are not
needed. Do not switch release channels or downgrade Bun automatically.

## Caption extraction

The following recipes are documented by
[yt-dlp](https://github.com/yt-dlp/yt-dlp#subtitle-options). Replace the example
URL with the real source and run in a task-owned temporary directory. Keep the
URL shell-quoted. For untrusted source strings use structured arguments rather
than interpolating them into shell code.

```bash
yt-dlp --ignore-config --no-plugin-dirs --no-remote-components \
  --no-js-runtimes --js-runtimes node --no-playlist \
  --socket-timeout 12 --retries 0 --extractor-retries 0 \
  --list-subs -- 'https://www.youtube.com/watch?v=VIDEO_ID'
yt-dlp --ignore-config --no-plugin-dirs --no-remote-components \
  --no-js-runtimes --js-runtimes node --no-playlist \
  --socket-timeout 12 --retries 0 --extractor-retries 0 \
  --skip-download --write-subs --write-auto-subs \
  --sub-langs 'fr.*,en.*' --sub-format 'vtt/best' \
  -o '%(id)s.%(ext)s' -- 'https://www.youtube.com/watch?v=VIDEO_ID'
```

List available languages first and replace `fr.*,en.*` with the relevant source
language when necessary (for example `ko.*` for Korean). Prefer manual captions
in the original language over auto-translated captions when available. Record
which tracks were actually downloaded; exit success alone does not prove a
caption file exists. Do not interpret auto-generated/translated captions as a
verified original transcript.

Use one original-language track when possible, such as `fr-orig` if the listing
offers it, rather than downloading every translated variant. Disable ambient
config and plugins, do not enable remote components, cookies, `--exec`,
`--netrc-cmd`, external downloaders or link-file output for this workflow.
Use a task-level time limit in addition to the socket timeout.

## Media downloads when requested

Download media only when requested and keep it outside version control. Without
ffmpeg, request video and audio separately rather than pretending they were
merged. For example, in the task's scratch directory:

```bash
yt-dlp --ignore-config --no-plugin-dirs --no-remote-components \
  --no-js-runtimes --js-runtimes node --no-playlist \
  --socket-timeout 12 --retries 0 --extractor-retries 0 --fragment-retries 0 \
  --max-filesize 150M --no-progress -f 'bv[height<=360][ext=mp4],ba[ext=m4a]' \
  -o '%(id)s.%(format_id)s.%(ext)s' -- 'https://www.youtube.com/watch?v=VIDEO_ID'
```

The file-size limit applies per selected file, not to the total task. DASH audio
may require ffmpeg for wider player compatibility. Check files actually exist
and report separate tracks accurately. Do not install ffmpeg implicitly or
download a whole playlist as a fallback. A successful download alone is not
evidence of understanding video or audio.

The Drunge video `u57rYYBDjak` was used on 2026-10-16 to verify separate video
and audio downloads plus French original auto-caption extraction. Reading its
full available transcript established text access, not visual observation or
independent verification of gameplay mechanics.

The IruMinaTi video `wqmi-tNPLU8` was also checked on 2026-10-16: separate
360p video/audio downloads and original French auto-captions succeeded. The
guide's spoken section was read through its conclusion at 50:19, excluding
the ending music. It explicitly uses a community-derived damage formula and
examples from advanced seasons; do not silently promote either to confirmed
current global mechanics. Keep timestamped source interpretation separate
from independent game fact-checking.

## Interpretation and failures

Read VTT cue times and text, collapse overlapping repeated phrases, preserve
the mapping back to source time ranges, and retain uncertainty in names or
numbers until corroborated. Plain subtitle extraction does not require ffmpeg.
Current yt-dlp documentation requires `yt-dlp-ejs` and a supported JavaScript
runtime for full YouTube support; consult its current
[dependency documentation](https://github.com/yt-dlp/yt-dlp#dependencies)
when the installed tool reports a dependency failure. Do not silently download
a full video or route audio through an external service as a fallback.

If captions are absent, access is restricted, or extraction fails, record the
error and stop that extraction route. Do not retry indefinitely or add cookies,
proxy bypasses or credentials. Use accessible textual corroboration, ask for
the relevant transcript/notes when needed, or deliver a provisional brief.
Delete only the scratch files created for this task after retaining the source
links, evidence notes and timestamps needed for the article.
