from py_fumen_util import disassemble, assemble, join, split;
import sys

def unglue(glued):
  if (type(glued) == type([])):
    return assemble(glued, False)
  return assemble([glued], False)[0]


def glue(unglued):
  if (type(unglued) == type([])):
    return disassemble(unglued, False)
  return disassemble([unglued], False)[0]

cmd = sys.argv[1];

if cmd == "fixcover": 
    fumens = sys.argv[2]
    gluedfumens = split([fumens])
    fumens = []
    for i in gluedfumens:
        fumens.append(glue(unglue(i)))
    fumens = " ".join(fumens)

    print(fumens)
elif cmd == "glue":
    fumens = sys.argv[2]
    print(glue(fumens))
elif cmd == "unglue":
    fumens = sys.argv[2]
    print(unglue(fumens))
