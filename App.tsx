                            <InteractiveImageViewer 
                                src={currentProject.views3d[currentProject.views3d.length - 1]} // Always show latest view
                                alt={currentProject.name} 
                                projectName={currentProject.name}
                                className="w-full h-full bg-neutral-900 relative overflow-hidden select-none touch-none"
                                onGenerateNewView={() => toggleModal('newView', true)} // Connect Camera Rotate button
                                shareUrl={currentProject ? `https://marcenapp.com/p/${currentProject.id}` : undefined}
                            />
                            
                            {/* Overlays */}
                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold pointer-events-none">
                                {currentProject.style}
                            </div>
                            
                            <div className="absolute bottom-4 left-4 flex gap-2 pointer-events-auto">
                                <button onClick={() => toggleModal('ar', true)} className="bg-white/90 text-[#3e3535] p-2 rounded-full shadow-lg hover:bg-white transition" title="Realidade Aumentada"><CubeIcon /></button>
                                <button onClick={handleShareProject} className="bg-white/90 text-[#3e3535] p-2 rounded-full shadow-lg hover:bg-white transition" title="Compartilhar Projeto"><ShareIcon /></button>
                            </div>
                        </div>
                        
                        {/* Quick Room Swap Bar - UPDATED TO ROOM TYPES */}