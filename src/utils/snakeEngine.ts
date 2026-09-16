export type SnakeDirection = 'U' | 'D' | 'L' | 'R';
export type SnakePosition = { x: number; y: number };

export const canTurnSnake = (from: SnakeDirection, to: SnakeDirection) =>
  from !== to && ({ U: 'D', D: 'U', L: 'R', R: 'L' }[from] !== to);

export const chooseSnakeFood = (body: SnakePosition[], size: number): SnakePosition | null => {
  const occupied = new Set(body.map(({ x, y }) => y * size + x));
  const free = Array.from({ length: size * size }, (_, i) => i).filter(i => !occupied.has(i));
  if (!free.length) return null;
  const cell = free[Math.floor(Math.random() * free.length)];
  return { x: cell % size, y: Math.floor(cell / size) };
};

export const stepSnake = (body: SnakePosition[], direction: SnakeDirection, food: SnakePosition | null, size: number) => {
  const offset = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] }[direction];
  const head = { x: body[0].x + offset[0], y: body[0].y + offset[1] };
  const ate = head.x === food?.x && head.y === food?.y;
  // The tail leaves its cell on non-growing moves, so that cell is safe.
  const solid = ate ? body : body.slice(0, -1);
  const collided = head.x < 0 || head.y < 0 || head.x >= size || head.y >= size
    || solid.some(cell => cell.x === head.x && cell.y === head.y);
  return { collided, ate: !collided && ate, body: collided ? body : [head, ...(ate ? body : body.slice(0, -1))] };
};
