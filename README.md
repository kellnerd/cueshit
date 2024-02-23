# cueshit

Convert between different cue sheet / chapter / tracklist formats.

## Usage

Install the command line app (once [Deno] is set up on your computer):

```sh
deno install --allow-read --allow-write https://deno.land/x/cueshit/cli.ts
```

Display the integrated help to learn how to use the CLI:

```sh
cueshit --help
```

The basic command to convert from one format to another looks as follows:

```sh
cueshit [input-path] --from <format> --to <format>
```

See the sections below for [examples](#examples) and an overview of the [supported formats](#supported-formats).

> [!NOTE]
> Currently the input (`--from` or `-f`) and output (`--to` or `-t`) format options are mandatory for conversion.
> Future versions of the CLI might be able to automatically detect input and output format based on file extensions and/or content.

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

## Supported Formats

Not all formats are supported as both input and output format (currently).

```
ID           Name                                             Input  Output
-----------  -----------------------------------------------  -----  ------
audacity     Audacity Label Track (TSV)                         X      X   
cue          Cue Sheet                                                 X   
losslesscut  LosslessCut Segments (CSV)                         X      X
musicbrainz  MusicBrainz Track Parser Listing                   X      X
ogm          OGM Tools Chapters / MKVToolNix Simple Chapters           X
youtube      Youtube Description with Chapters                  X      X
```

List all formats which are currently available for the CLI:

```sh
cueshit formats
```

[Deno]: https://deno.com/
