import { Elysia } from 'elysia';
new Elysia().get('/config/:id', ({ params: { id } }) => id).listen(3000);
