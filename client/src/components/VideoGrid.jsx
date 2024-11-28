import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const VideoGrid = ({ localVideo, remoteStreams, activeVideo, setActiveVideo }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const videosPerPage = 8;
    
    // Filter out active video from grid view
    const gridVideos = remoteStreams.filter(stream => stream.id !== activeVideo?.id);
    const totalPages = Math.ceil(gridVideos.length / videosPerPage);
    
    const nextPage = () => {
        setCurrentPage(prev => (prev + 1) % totalPages);
    };
    
    const previousPage = () => {
        setCurrentPage(prev => (prev - 1 + totalPages) % totalPages);
    };

    return (
        <div className="w-full h-full relative">
            {/* Main featured video */}
            <div className="w-full h-full mb-4">
                {activeVideo ? (
                    <video
                        id={`video-${activeVideo.id}`}
                        autoPlay
                        playsInline
                        className="w-full h-[calc(100vh-12rem)] object-cover rounded-lg"
                    />
                ) : (
                    <div className="w-full h-[calc(100vh-12rem)] bg-gray-800 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400">No active video</span>
                    </div>
                )}
            </div>

            {/* Local video - always visible in corner */}
            <div className="fixed bottom-20 right-8 z-50">
                <video
                    ref={localVideo}
                    autoPlay
                    playsInline
                    muted
                    className="w-48 h-36 rounded-lg shadow-lg border-2 border-blue-500"
                />
            </div>

            {/* Grid of other participants */}
            {gridVideos.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-90 p-4">
                    <div className="relative">
                        {/* Navigation arrows */}
                        {totalPages > 1 && (
                            <>
                                <button
                                    onClick={previousPage}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full z-10 bg-gray-800 p-2 rounded-full hover:bg-gray-700"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={nextPage}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full z-10 bg-gray-800 p-2 rounded-full hover:bg-gray-700"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </>
                        )}

                        {/* Video grid */}
                        <div className="grid grid-cols-4 gap-2 max-w-6xl mx-auto">
                            {gridVideos
                                .slice(currentPage * videosPerPage, (currentPage + 1) * videosPerPage)
                                .map((stream) => (
                                    <div
                                        key={stream.id}
                                        className="aspect-video relative cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => setActiveVideo(stream)}
                                    >
                                        <video
                                            id={`video-${stream.id}`}
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                        {stream.username && (
                                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                                                {stream.username}
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>

                        {/* Page indicator */}
                        {totalPages > 1 && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2 mt-2">
                                {[...Array(totalPages)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full ${
                                            i === currentPage ? 'bg-blue-500' : 'bg-gray-500'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoGrid;