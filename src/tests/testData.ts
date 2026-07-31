const timestamp = Date.now();

export const testUser = {
    name: "Test User",
    email: `user-${timestamp}@test.com`,
    password: "password123",
    role: "user"
};

export const testAdmin = {
    name: "Test Admin",
    email: `admin-${timestamp}@test.com`,
    password: "password123",
    role: "admin"
};