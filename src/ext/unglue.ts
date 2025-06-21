import { Field, Mino } from "tetris-fumen";
import { decode } from "tetris-fumen/lib/decoder";
import { parsePiece, parseRotation, Piece } from "tetris-fumen/lib/defines";
import { encode } from "tetris-fumen/lib/encoder";
import { getBlocks, getBlockXYs } from "tetris-fumen/lib/inner_field";

export function cleared_offset(rows_cleared: Set<number>, y: number): number {
  for (const row of rows_cleared) {
    if (y >= row) {
      y++;
    }
  }

  return y;
}
export function assemble(
  fumen_codes: Array<string>,
  print_error: boolean = true,
  keep_invalid: boolean = true
) {
  const results = [];
  for (const code of fumen_codes) {
    try {
      let rows_cleared: Set<number> = new Set();
      const input_pages = decode(code);
      const field = input_pages[0].field.copy();

      for (const page of input_pages) {
        const operation = page.operation;
        if (operation === undefined) {
          if (print_error) {
            console.log("warning: skipped a page with no operation");
          }

          continue;
        }

        for (const { x: dx, y: dy } of getBlockXYs(
          parsePiece(operation.type),
          parseRotation(operation.rotation),
          0,
          0
        )) {
          const x = operation.x + dx;
          const y = cleared_offset(rows_cleared, operation.y + dy);

          if (print_error && field.at(x, y) !== "_") {
            console.log("error: operation overlaps with current field");
          }

          field.set(x, y, operation.type);
        }

        const new_rows_cleared: Set<number> = new Set();
        for (let dy = -2; dy < 3; dy++) {
          const y = cleared_offset(rows_cleared, operation.y + dy);
          if (y >= 0 && is_lineclear_at(field, y)) {
            new_rows_cleared.add(y);
          }
        }

        rows_cleared = rows_cleared.union(new_rows_cleared);
      }

      results.push("v115@" + encode([{ field }]));
    } catch (e) {
      if (keep_invalid) {
        results.push("");
      }

      if (print_error) {
        console.error(e);
      }
    }
  }

  return results;
}

export function is_lineclear_at(field: Field, y: number): boolean {
  for (let x = 0; x < 10; x++) {
    if (field.at(x, y) === "_") {
      return false;
    }
  }

  return true;
}
