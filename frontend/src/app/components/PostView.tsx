import React from "react";

interface PostOverlayProps {
    selectedPost: {
        title: string;
        post_content_text: string;
        post_content_image?: string;
    } | null;
    onClose: () => void;
}

const PostOverlay: React.FC<PostOverlayProps> = ({ selectedPost, onClose }) => {
    if (!selectedPost) return null;

    return (
        <div>
            {/* Modal box with relative positioning */}
            <div className="relative w-[90%] max-w-[600px] h-[90%] max-h-[600px] bg-black p-6 rounded overflow-auto border border-white">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-white text-xl"
                >
                    [x]
                </button>
                <h2 className="text-xl font-bold">{selectedPost.title}</h2>
                <p className="mt-2">{selectedPost.post_content_text}</p>

                {selectedPost.post_content_image && (
                    <img
                        src={selectedPost.post_content_image}
                        alt={selectedPost.title}
                        className="mt-4 max-w-full max-h-[300px] object-contain"
                    />
                )}
            </div>
        </div>
    );
};

export default PostOverlay;