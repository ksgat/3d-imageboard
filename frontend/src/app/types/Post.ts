
export interface Post {
    post_id: string;      // UUID primary key
    title: string;
    point_x: number ;
    point_y: number ;
    point_z: number ;
    post_content_text: string | null;
    post_content_image?: string | null;
    parent_id?: string | null;
    created_at: string;
    poster_id: string; 
}
