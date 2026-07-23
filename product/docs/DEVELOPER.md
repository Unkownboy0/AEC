# GEETORUS CAMPUSOS - Developer Documentation

This document defines the coding standards, patterns, and style guides for engineers developing on **GEETORUS CAMPUSOS**.

---

## Coding Standards

### 1. General Principles
- **TypeScript Strict Mode**: Keep `"strict": true` enabled. Avoid using the `any` keyword. Instead, define exact Interfaces or Types.
- **Naming Conventions**:
  - **Files & Folders**: Use PascalCase for React components (e.g. `MainLayout.tsx`, `Button.tsx`). Use camelCase for hooks, contexts, and helper files (e.g. `useAuth.ts`, `axios.ts`).
  - **Variables & Functions**: Use camelCase for standard variables and functions.
  - **Constants**: Use UPPER_SNAKE_CASE for constant values.

---

## Backend (Server) Standards

### 1. Request Handling
- Input datasets must be parsed and sanitized using **Zod** schema guards before executing business logic.
- Avoid passing raw request arguments directly into Prisma queries.
- Controllers must wrap operations in standard `try/catch` statements and forward exceptions to the `next` handler.

### 2. Module Folder Layout
Keep code organized by feature module inside `/src/modules`:
```bash
/modules/auth
  ├── auth.controller.ts    # Route controller handlers
  └── auth.routes.ts        # Express endpoints definitions
```

---

## Frontend (Client) Standards

### 1. CSS & styling Rules
- Use HSL variables (e.g., `hsl(var(--primary))`) to define color values. This ensures that the user interface supports seamless theme toggling.
- Use Tailwind CSS utility classes.
- Ensure that elements include hover states and micro-animations to create a premium, responsive feel.
  - Ex: Use `transition-all duration-200 hover:bg-primary/90` on buttons.

### 2. Component Design Pattern
Wrap custom React primitives in `React.forwardRef` to allow them to be used with parent refs and form libraries like React Hook Form.

Example:
```tsx
export const CustomInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div>
        {label && <label>{label}</label>}
        <input ref={ref} className={className} {...props} />
        {error && <p>{error}</p>}
      </div>
    );
  }
);
```

### 3. Forms & Validations
- Build complex forms using `react-hook-form` and `@hookform/resolvers/zod`.
- Bind validation schemas at the top level of the component.
- Display red borders and helper messages for active validation errors.

### 4. Data Querying (TanStack Query)
- Manage server-side caching and mutations using TanStack Query.
- Example pattern for query hooks:
```typescript
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });
};
```
