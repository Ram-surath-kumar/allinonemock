import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Building, Layers, DoorOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Recursive Tree Item
const TreeItem = ({ item, level = 0, onSelect, selectedId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = item.children && item.children.length > 0;

    // Determine Icon based on level or type
    let Icon = Building;
    if (level === 1) Icon = Layers; // Floor
    if (level === 2) Icon = DoorOpen; // Room

    const isSelected = selectedId === item.id;

    const handleClick = (e) => {
        e.stopPropagation();
        if (hasChildren) {
            setIsOpen(!isOpen);
        }
        if (onSelect && level === 2) { // Only select rooms for now
            onSelect(item);
        }
    };

    return (
        <div className="select-none">
            <div
                className={cn(
                    "flex items-center py-1.5 px-2 rounded-md cursor-pointer transition-colors text-sm hover:bg-accent/50",
                    isSelected ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground",
                    level === 0 ? "font-semibold text-foreground mb-1 mt-2" : ""
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleClick}
            >
                {hasChildren && (
                    <span className="mr-1 shrink-0">
                        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </span>
                )}
                {!hasChildren && <span className="w-4 mr-1" />} {/* Spacer */}

                <Icon className={cn("h-4 w-4 mr-2", isSelected ? "text-primary" : "text-muted-foreground/70")} />
                <span className="truncate">{item.label}</span>
            </div>

            {hasChildren && isOpen && (
                <div>
                    {item.children.map(child => (
                        <TreeItem
                            key={child.id || child.label}
                            item={child}
                            level={level + 1}
                            onSelect={onSelect}
                            selectedId={selectedId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export function FacilitiesTree({ data, onSelectRoom, selectedRoomId }) {
    if (!data) return <div className="text-sm text-muted-foreground p-4">Loading hierarchy...</div>;
    if (data.length === 0) return <div className="text-sm text-muted-foreground p-4">No buildings found.</div>;

    // Transform API data to Tree structure if needed, or assume API returns a compatible structure.
    // API returns: Buildings -> floors -> rooms
    // We need to map this to the component's expected structure: { id, label, children: [] }

    const treeData = data.map(bld => ({
        id: bld.id,
        label: bld.name,
        type: 'building',
        children: bld.floors.map(fl => ({
            id: `${bld.id}-floor-${fl.floor_number}`,
            label: `Floor ${fl.floor_number}`,
            type: 'floor',
            children: fl.rooms.map(room => ({
                id: room.id,
                label: `${room.room_number} - ${room.room_name || room.room_type}`,
                type: 'room',
                ...room // passing full room data just in case
            }))
        }))
    }));

    return (
        <div className="space-y-1">
            {treeData.map(item => (
                <TreeItem
                    key={item.id}
                    item={item}
                    onSelect={(node) => node.type === 'room' && onSelectRoom(node.id)}
                    selectedId={selectedRoomId}
                />
            ))}
        </div>
    );
}
