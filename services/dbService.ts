
// ... existing imports ...

// --- ANILO SHOP SERVICES ---

export const getShopProducts = async (
    category: string = 'all', 
    sort: 'newest' | 'price_asc' | 'price_desc' | 'popular' = 'newest',
    searchQuery: string = ''
): Promise<ShopProduct[]> => {
    let query = supabase.from('shop_products').select('*').eq('is_active', true);
    
    if (category !== 'all') {
        query = query.eq('category', category);
    }

    if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
    }

    // Sorting logic
    if (sort === 'price_asc') query = query.order('price', { ascending: true });
    else if (sort === 'price_desc') query = query.order('price', { ascending: false });
    else if (sort === 'popular') query = query.order('sales_count', { ascending: false });
    else query = query.order('id', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

// ... other shop functions stay the same but update create/update to handle new fields ...
export const createShopProduct = async (product: Partial<ShopProduct>) => {
    const { data, error } = await supabase.from('shop_products').insert(product).select().single();
    if (error) throw error;
    return data;
};

export const updateShopProduct = async (id: number, updates: Partial<ShopProduct>) => {
    const { error } = await supabase.from('shop_products').update(updates).eq('id', id);
    if (error) throw error;
};

// ... rest of dbService ...
