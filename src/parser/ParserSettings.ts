
import * as parser from "parser-monad";

const rawSpace: parser.Parser<string> = parser.Parser.orMany([
        parser.RawLit("\n"),
        parser.RawLit("\r"),
        parser.RawLit(" "),
        parser.RawLit("\t"),
    ]);

const lineCont: parser.Parser<string> =
    parser.RawLit("_")
    .first(rawSpace.repeat());

parser.ParserSettings.WHITESPACE = [" ", "\t", "\r", lineCont];
parser.ParserSettings.LINE_COMMENT = ["'"];
parser.ParserSettings.LINE_COMMENT_END = ["\n", "%>"];
parser.ParserSettings.CASE_SENSITIVE = false;
