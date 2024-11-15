# cueshit

Convert between different cue sheet / chapter / tracklist formats.

Each supported input format is parsed into an [internal representation] which can be serialized into a supported output format.

The command line app can read from standard input (default), local files (specify a path) and online resources (specify an URL).
It will write to standard output (default) or to a local file (specify a path).

## Setup

Install the command line app (once [Deno] is set up on your computer):

```sh
deno install --allow-read --allow-write --allow-net https://deno.land/x/cueshit/cli.ts
```

If you have installed [FFmpeg], you can alternatively install the CLI with enabled FFmpeg integration:

```sh
deno install --allow-run=ffmpeg,ffprobe --allow-read --allow-write --allow-net https://deno.land/x/cueshit/cli.ts
```

This allows you to read embedded chapters directly from multimedia files using [ffprobe].
Additionally you can also split multimedia files into one file per chapter.

## Usage

Display the integrated help to learn how to use the CLI:

```sh
cueshit --help
```

The basic command to convert from one format to another looks as follows:

```sh
cueshit [input-path-or-url] [--from <format>] [--to <format>] [--output <path>]
```

See the sections below for [examples](#examples) and an overview of the [supported formats](#supported-formats).

> [!NOTE]
> Input format (`--from` or `-f`) and output format (`--to` or `-t`) options are optional for conversion (since v0.3).
> If these are not specified, the CLI automatically tries to detect them based on file extensions (and content).

All formats which can be parsed (including embedded chapters) can also be used to split a multimedia file into its chapters.
The following subcommand calls `ffmpeg` with the appropriate arguments under the hood:

```sh
cueshit split [--from <format>] <input-path-or-url> [ffmpeg-options...]
```

Again you can display the integrated help to learn more about the command:

```sh
cueshit split --help
```

> [!NOTE]
> Many supported cue sheet formats can not store the path to the associated media file.
> For these formats the path to the source media file has to be passed with `--sheet.media-file <path>`.

### Examples

Convert chapters from a YouTube description into a MusicBrainz track parser listing.
Input is read from standard input (via `cat`), output is written to standard output (by default):

```
$ cat << --- | cueshit --from youtube --to musicbrainz
Lines which do not start with a timestamp will be skipped.
0:00 Test Title
2:56 Another Title
4:17 Final Title
---
1. Test Title (2:56)
2. Another Title (1:21)
3. Final Title (?:??)
```

Extract chapters from a FLAC audio file using [ffprobe] and store them as a cue sheet (`test.cue`):

```sh
ffprobe -v error -of json -show_format -show_streams -show_chapters test.flac | cueshit -o test.cue
```

If you have enabled the FFmpeg integration during installation, the above command can be simplified to (since v0.4):

```sh
cueshit test.flac --output test.cue
```

You can also split the audio into one file per chapter instead:

```sh
cueshit split test.flac
```

Create a cue sheet from an Audacity label track (`labels.txt`) which belongs to the audio from `test.wav`.
Since the input format only contains chapters and does not know about the audio file, it has to be specified manually:

```sh
cueshit -f audacity labels.txt -o test.cue --sheet.media-file test.wav
```

Additional cue sheet properties can be specified via the `--sheet.title` and `--sheet.performer` options.

## Supported Formats

Not all formats are supported as both input and output format (currently).
You can read the documentation for all formats inside their [modules](https://deno.land/x/cueshit/format).

```
ID           Input  Output  Name
-----------  -----  ------  -----------------------------------------------
audacity       X      X     Audacity Label Track (TSV)
cue                   X     Cue Sheet
ffmpeg                X     FFmpeg Split Commands
ffprobe        X            ffprobe Metadata with Chapters (JSON)
ia-segments    X            Internet Archive Segment Data (JSON)
internal              X     Internal Representation (JSON)
llc                   X     LosslessCut Project (LLC)
losslesscut    X      X     LosslessCut Segments (CSV)
musicbrainz    X      X     MusicBrainz Track Parser Listing
mb-api         X            MusicBrainz API Release (JSON)
ogm                   X     OGM Tools Chapters / MKVToolNix Simple Chapters
youtube        X      X     Youtube Description with Chapters
```

List all formats which are currently available for the CLI:

```sh
cueshit formats
```

[Deno]: https://deno.com/
[internal representation]: https://deno.land/x/cueshit/cuesheet.ts?s=CueSheet
[FFmpeg]: https://ffmpeg.org/
[ffprobe]: https://ffmpeg.org/ffprobe.html
