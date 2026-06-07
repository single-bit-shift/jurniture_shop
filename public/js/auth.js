const auth = {
    setToken: (token) => {
        localStorage.setItem('token', token);
    },

    getToken: () => {
        return localStorage.getItem('token');
    },

    setUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
    },

    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isLoggedIn: () => {
        return !!localStorage.getItem('token');
    },

    isAdmin: () => {
        const user = auth.getUser();
        // Check if user exists and has isAdmin property set to true
        // (It was previously role === 'admin' before the user schema change)
        return user && user.isAdmin === true;
    },

    logout: () => {
        signOut();
        window.location.href = '/login.html';
    }
};

// Global authentication helper functions
const isLoggedIn = () => auth.isLoggedIn();
const getUser = () => auth.getUser();
const isAdmin = () => auth.isAdmin();
const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};