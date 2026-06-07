document.addEventListener('DOMContentLoaded', async () => {
    // Basic navigation and rendering categories
    const loadCategories = async () => {
        try {
            const res = await api.getCategories();
            if(res.success) {
                console.log('Categories loaded', res.data);
                // The HTML already has hardcoded categories styled perfectly.
                // In a real app we'd map res.data to the DOM elements.
            }
        } catch (err) {
            console.error(err);
        }
    };
    loadCategories();
});
