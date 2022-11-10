- top-down operator precedence parser (aka Pratt parser)
  - starts with constructing root node and then descends

variable bindings

```
let x = 5;
let y = 10;
let foobar = add(5, 5);
let barfoo = 5 * 5 / 10 + 18 - add(5, 5) + multiply(124);
let anotherName = barfoo;
```

let <identifier> = <expression>;
