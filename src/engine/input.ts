import { PieceType, RotationType } from "tetris-fumen/lib/defines";
import { Operation } from "tetris-fumen/lib/field";

export interface Coordinate {
  x: number;
  y: number;
}
export interface Kick {
  piece: PieceType;
  initial: RotationType;
  final: RotationType;
  kicks: Array<Coordinate>;
}

export enum Key {
  RotateCW = "rotateCW",
  RotateCCW = "rotateCCW",
  Rotate180 = "rotate180",
  MoveRight = "moveRight",
  MoveLeft = "moveLeft",
  SoftDrop = "softDrop",
  SonicDrop = "sonicDrop",
  DasLeft = "dasLeft",
  DasRight = "dasRight",
}

export function say_key(k: Key): string {
  return {
    [Key.DasLeft]: "DAS Left",
    [Key.DasRight]: "DAS Right",
    [Key.MoveLeft]: "Move Left",
    [Key.MoveRight]: "Move Right",
    [Key.Rotate180]: "Rotate 180",
    [Key.RotateCCW]: "Rotate CCW",
    [Key.RotateCW]: "Rotate CW",
    [Key.SoftDrop]: "Soft Drop",
    [Key.SonicDrop]: "Sonic Drop",
  }[k];
}

const rmap = {
  N: "spawn",
  E: "right",
  S: "reverse",
  W: "left",
  0: "spawn",
  1: "right",
  2: "reverse",
  3: "left",
} as const;
const lmap = { spawn: 0, right: 1, reverse: 2, left: 3 };

export function kicktable(t: string): Array<Kick> {
  return t
    .split("\n")
    .map((x) => x.trim())
    .filter((x) => x !== "")
    .map((line) => {
      const [piece, , initial, final, , ...z] = line;
      const kicks = z
        .join("")
        .slice(1, -1)
        .split(")(")
        .map((x) => x.split(",").map(Number))
        .map(([x, y]) => ({ x, y }));
      const i = rmap[initial as keyof typeof rmap];
      const f = rmap[final as keyof typeof rmap];
      return {
        piece: piece as PieceType,
        initial: i,
        final: f,
        kicks,
      };
    });
}

export interface PieceDef {
  piece: PieceType;
  rotation: RotationType;
  cells: Array<Coordinate>;
}
export function piecetable(t: string): Array<PieceDef> {
  return t
    .split("\n")
    .map((x) => x.trim())
    .filter((x) => x !== "")
    .map((line) => {
      const [piece, , rotation, , ...z] = line;
      const r = rmap[rotation as keyof typeof rmap];
      const cells = z
        .join("")
        .slice(1, -1)
        .split(")(")
        .map((x) => x.split(",").map(Number))
        .map(([x, y]) => ({ x, y }));
      return { piece: piece as PieceType, rotation: r, cells };
    });
}

export enum SpinBonuses {
  TSpins,
  TSpinsImmobile,
  AllSpinImmobile,
  AllSpin,
  AllMiniImmobile,
  AllMini,
  MiniOnly,
  Handheld,
  Stupid,
  None,
}

const widths: Record<PieceType, number> = {
  _: 0,
  I: 4,
  J: 3,
  L: 3,
  O: 2,
  S: 3,
  T: 3,
  X: 0,
  Z: 3,
};

// on 10
// I4
// L4 J4

export interface InputSnapshot {
  placement: Operation;
  board: Array<Array<PieceType>>;
}
// a whole fucking tetris engine bruh ▲ slow
export class Input {
  private current: Operation;
  private pressed: Array<Key> = [];
  public constructor(
    readonly width: number,
    readonly height: number,
    readonly margin: number,
    public board: Array<Array<PieceType>>,
    readonly piece: PieceType,
    readonly kicktable: Array<Kick>,
    readonly piecetable: Array<PieceDef>,
    readonly spin_detection: SpinBonuses
  ) {
    while (board.length < height + margin) {
      board.unshift(Array(width).fill("_"));
    }
    // piece spawn
    this.current = {
      type: this.piece,
      rotation: "spawn",
      x: Math.floor(this.width / 2 - 1),
      y: height,
    };
  }

  public snapshot(): InputSnapshot {
    return { placement: this.current, board: this.board };
  }

  public restore(snap: InputSnapshot) {
    this.current = snap.placement;
    this.board = snap.board;
  }

  public at(x: number, y: number): PieceType {
    const dy = this.board.length - y - 1;
    const result = this.board[dy]?.[x];
    if (result === undefined) {
      
      return "X";
    }
    return result;
  }

  public put(x: number, y: number, piece: PieceType) {
    this.board[this.board.length - y - 1][x] = piece;
  }

  public cells(): Array<readonly [number, number]> {
    const placement = this.current;
    
    const raw_cells = this.piecetable.find(
      (x) => x.piece === placement.type && x.rotation === placement.rotation
    )!.cells;

    const cells = raw_cells.map(
      (p) => [p.x + placement.x, p.y + placement.y] as const
    );

    return cells;
  }

  public check(temp?: Operation): boolean {
    const zz = this.current;
    if (temp) {
      this.current = temp;
    }
    const cells = this.cells();
    for (const [cx, cy] of cells) {
      const t = this.at(cx, cy);
      if (t !== "_") {
        
        this.current = zz;
        return false;
      }
    }

    this.current = zz;
    return true;
  }

  public press(k: Key) {
    if (k === Key.MoveLeft) {
      this.move_left();
    }

    if (k === Key.MoveRight) {
      this.move_right();
    }

    if (k === Key.Rotate180) {
      this.flip();
    }

    if (k === Key.RotateCCW) {
      this.ccw();
    }

    if (k === Key.RotateCW) {
      this.cw();
    }

    if (k === Key.SoftDrop) {
      this.soft_drop();
    }

    if (k === Key.SonicDrop) {
      this.sonic_drop();
    }

    if (k === Key.DasLeft) {
      this.das_left();
    }

    if (k === Key.DasRight) {
      this.das_right();
    }
  }

  public move_right(): void {
    this.pressed.push(Key.MoveRight);
    this.current.x += 1;
    if (!this.check()) {
      this.current.x -= 1;
    }
  }

  public move_left(): void {
    this.pressed.push(Key.MoveLeft);
    this.current.x -= 1;
    if (!this.check()) {
      this.current.x += 1;
    }
  }

  public soft_drop(): void {
    this.pressed.push(Key.SoftDrop);
    this.current.y -= 1;
    if (!this.check()) {
      this.current.y += 1;
    }
  }

  public sonic_drop(): void {
    this.pressed.push(Key.SonicDrop);
    while (true) {
      this.current.y -= 1;
      if (!this.check()) {
        this.current.y += 1;
        break;
      }
    }
  }

  public das_left(): void {
    this.pressed.push(Key.DasLeft);
    while (true) {
      this.current.x -= 1;
      if (!this.check()) {
        this.current.x += 1;
        break;
      }
    }
  }

  public das_right(): void {
    this.pressed.push(Key.DasRight);
    while (true) {
      this.current.x += 1;
      if (!this.check()) {
        this.current.x -= 1;
        break;
      }
    }
  }

  public rotate_by(n: number): void {
    const i = this.current.rotation;

    const f =
      rmap[((lmap[this.current.rotation] + n + 4) % 4) as keyof typeof rmap];
    
    const kt = this.kicktable.find(
      (x) => x.initial === i && x.final === f && x.piece === this.current.type
    ) || { kicks: [{ x: 0, y: 0 }] };

    if (kt === undefined) {
      return;
    }

    let m = 0;
    
    for (const kick of kt.kicks) {
      this.current.x += kick.x;
      this.current.y += kick.y;
      this.current.rotation = f;
      m++;

      if (!this.check()) {
        
        this.current.x -= kick.x;
        this.current.y -= kick.y;
        this.current.rotation = i;
        continue;
      }

      
      return;
    }
  }

  public ccw(): void {
    this.pressed.push(Key.RotateCCW);
    return this.rotate_by(-1);
  }

  public cw(): void {
    this.pressed.push(Key.RotateCW);
    return this.rotate_by(1);
  }

  public flip(): void {
    this.pressed.push(Key.Rotate180);
    return this.rotate_by(2);
  }

  public get(): Operation {
    return this.current;
  }
}
