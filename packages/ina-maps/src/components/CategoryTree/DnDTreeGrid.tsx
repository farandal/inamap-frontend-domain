import React, { useEffect, useState, useRef } from 'react';
import { set, useController } from "react-hook-form";
import { useDialog } from 'dash-dialog';
import { NodeRendererProps, Tree, DragPreviewProps, CursorProps } from 'react-arborist';
import { TextField, Box, Button, IconButton, Typography, Paper, ButtonGroup, Card } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import useWindowSize from 'dash-admin/src/hooks/window/useWindowSize';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Chip } from '@mui/material';
import { polyfill } from 'mobile-drag-drop';
import { scrollBehaviourDragImageTranslateOverride } from 'mobile-drag-drop/scroll-behaviour';

// Initialize mobile drag-drop polyfill for touch support
polyfill({
    dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
    forceApply: true, // Force apply on all touch devices
});

// Optional: Add class to enable hold-to-drag on touch devices
if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
}

interface CategoryData {
    id: number | string;
    name: string;
    is_primary?: boolean;
    image_url?: string;
    tree_index?: number;
    subcategories?: CategoryData[];
}

interface TreeNodeData {
    id: string;
    name: string;
    is_primary: boolean;
    image_url?: string;
    index: number;
    children?: TreeNodeData[];
}

interface DefaultNodeProps extends NodeRendererProps<TreeNodeData> {
    onEdit: (e: React.MouseEvent, node: any) => void;
    onDelete: (e: React.MouseEvent, node: any) => void;
}


const CursorRow: React.FC<CursorProps> = ({ top, left, indent }) => (
    <div
        style={{
            position: 'absolute',
            top: top - 2,
            left,
            width: `calc(100% - ${indent}px)`,
            height: '4px',
            background: '#2196f3',
            zIndex: 1,
        }}
    >
        <div
            style={{
                position: 'absolute',
                left: -6,
                top: -4,
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#2196f3',
            }}
        />
    </div>
);

const DefaultNode: React.FC<DefaultNodeProps> = (props) => {
    const { node, style, dragHandle, tree, onEdit, onDelete } = props;

    if (!node || !node.data) {
        console.error("Invalid node:", node);
        return null;
    }

    const isPrimary = node.data.is_primary;
    const isFolder = !node.isLeaf;
    const folder = Array.isArray(node.data.children);
    const open = node.state.isOpen;
    const name = node.data.name;
    const isSelected = node.isSelected;
    const isDragging = node.isDragging;
    const imageUrl = node.data.image_url;

    const rowClassNames = [
        'row',
        isSelected ? 'isSelected' : '',
        isDragging ? 'dragging' : '',
    ].filter(Boolean).join(' ');

    const handleClick = () => {
        if (isFolder) {
            node.toggle();
        }
    };

    return (
        <div
            className={rowClassNames}
            style={{
                ...style,
                cursor: isFolder ? 'pointer' : 'default',
            }}
            ref={dragHandle}
            onClick={handleClick}
        >
            <DragIndicatorIcon 
                fontSize="small" 
                style={{ 
                    marginRight: '4px', 
                    cursor: 'grab',
                }} 
            />
            <div style={{ marginRight: '8px', display: 'flex', alignItems: 'center' }}>
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={name}
                        style={{ 
                            width: '24px', 
                            height: '24px', 
                            objectFit: 'contain',
                            borderRadius: '4px'
                        }} 
                    />
                ) : (
                    isFolder ? (
                        node.isOpen ? <FolderOpenIcon fontSize="small" /> : <FolderIcon fontSize="small" />
                    ) : (
                        <InsertDriveFileIcon fontSize="small" />
                    )
                )}
            </div>
            <Typography
                className="row-contents"
                style={{
                    flexGrow: 1,
                    fontWeight: node.isSelected ? 'bold' : 'normal'
                }}
            >
                {node.data.name}
            </Typography>
            <ButtonGroup size="small">
                <IconButton
                    onClick={(e) => onEdit(e, node)}
                >
                    <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                    onClick={(e) => onDelete(e, node)}
                    disabled={isPrimary}
                >
                    {isPrimary ?
                        <Typography variant="caption">Principal</Typography> :
                        <DeleteIcon fontSize="small" />
                    }
                </IconButton>
            </ButtonGroup>
        </div>
    );
};

const DnDTreeGrid: React.FC<{ data: CategoryData[]; onEdit: any; onDelete: any }> = (props) => {
    const { data, onEdit, onDelete, ...rest } = props;
    const treeFormData = useController({ name: 'treeData' });
    const dialog = useDialog();
    const [searchText, setSearchText] = useState('');
    const treeRef = useRef(null);
    
    // DEBUG: Log raw data from props immediately
    console.log("=== DnDTreeGrid RENDER ===");
    console.log("Raw data prop:", JSON.stringify(data?.map(d => ({ id: d.id, name: d.name, subCount: d.subcategories?.length })), null, 2));

    // DragPreview component with access to treeData via closure
    const DragPreview: React.FC<DragPreviewProps> = ({ offset, mouse, id, dragIds, isDragging }) => {
        // Find the dragged nodes
        const findNodeById = (nodes: TreeNodeData[], id: string): TreeNodeData | null => {
            for (const node of nodes) {
                if (node.id === id) return node;
                if (node.children) {
                    const found = findNodeById(node.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        const draggedNodes = dragIds.map(dragId => findNodeById(treeData, dragId)).filter(Boolean);

        if (draggedNodes.length === 0) {
            return <Chip label={`${dragIds.length}`} />;
        }

        // Show preview for the first dragged node, with count if multiple
        const firstNode = draggedNodes[0];
        const isFolder = firstNode.children && firstNode.children.length > 0;

        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    pointerEvents: 'none',
                    maxWidth: '300px',
                    zIndex: 1000,
                }}
            >
                <DragIndicatorIcon fontSize="small" style={{ marginRight: '4px', color: '#666' }} />
                <div style={{ marginRight: '8px' }}>
                    {isFolder ? (
                        <FolderIcon fontSize="small" style={{ color: '#1976d2' }} />
                    ) : (
                        <InsertDriveFileIcon fontSize="small" style={{ color: '#666' }} />
                )}
                </div>
                <Typography
                    variant="body2"
                    style={{
                        flexGrow: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontWeight: 500,
                        color: '#333',
                    }}
                >
                    {firstNode.name}
                    {draggedNodes.length > 1 && ` (+${draggedNodes.length - 1} more)`}
                </Typography>
            </div>
        );
    };

    const convertToTreeFormat = (categories: CategoryData[], parentIndex = 0): TreeNodeData[] => {
        if (!categories || !Array.isArray(categories)) return [];

        return categories.map((category, idx) => {
            // Ensure we have a valid ID
            const categoryId = category.id?.toString() || `temp_${idx}`;
            console.log(`Converting category: id=${categoryId}, name=${category.name}`);
            
            return {
                id: categoryId,
                name: category.name,
                is_primary: category.is_primary || false,
                image_url: category.image_url,
                index: category.tree_index ?? (parentIndex + idx),
                children: category.subcategories && category.subcategories.length > 0
                    ? convertToTreeFormat(category.subcategories, (parentIndex + idx) * 100)
                    : []
            };
        });
    };

    const convertFromTreeFormat = (treeData: TreeNodeData[]): CategoryData[] => {
        if (!treeData || !Array.isArray(treeData)) return [];

        return treeData.map((node, idx) => {
            // Keep the ID as-is - UUIDs should remain strings
            // Only convert to number if it's a purely numeric string (no letters)
            const nodeId = node.id;
            const isNumericOnly = /^\d+$/.test(nodeId);
            const finalId = isNumericOnly ? parseInt(nodeId, 10) : nodeId;
            
            console.log(`Converting back: node.id=${nodeId}, finalId=${finalId}, name=${node.name}`);
            
            return {
                id: finalId,
                name: node.name,
                is_primary: node.is_primary,
                image_url: node.image_url,
                tree_index: idx, // Use the current position in the array as the index
                subcategories: node.children && node.children.length > 0
                    ? convertFromTreeFormat(node.children)
                    : []
            };
        });
    };

    const [treeData, setTreeData] = useState<TreeNodeData[]>([]);

    useEffect(() => {
        if (data && Array.isArray(data)) {
            console.log("Input data from props:", JSON.stringify(data, null, 2));
            const formattedData = convertToTreeFormat(data);
            setTreeData(formattedData);
            console.log("Tree data initialized:", JSON.stringify(formattedData, null, 2));
        } else {
            console.warn("Invalid data format:", data);
            setTreeData([]);
        }
    }, [data]);

   const windowSize = useWindowSize();
const containerRef = useRef<HTMLDivElement>(null);
const [currentWidth, setCurrentWidth] = useState<number>(null);
const [currentHeight, setCurrentHeight] = useState<number>(null);

useEffect(() => {
    const updateDimensions = () => {
        if (containerRef.current) {
            setCurrentWidth(containerRef.current.offsetWidth);
            setCurrentHeight(document.documentElement.clientHeight - 400);
        }
    };

    // Initial update with a small delay to ensure DOM is ready
    setTimeout(updateDimensions, 100);
    updateDimensions();
}, [windowSize.width, windowSize.height]); // Depend on windowSize instead of manual event listener
    
    
    
    
    useEffect(() => {
        if (treeData && treeData.length > 0) {
            console.log("Tree data before conversion:", JSON.stringify(treeData, null, 2));
            const originalFormat = convertFromTreeFormat(treeData);
            console.log("Form data to be sent:", JSON.stringify(originalFormat, null, 2));
            treeFormData.field.onChange(originalFormat);
        }
    }, [treeData]);

    const searchMatch = (node: TreeNodeData, term: string) => {
        return node.name.toLowerCase().includes(term.toLowerCase());
    };

    const handleSearch = () => {
        if (!searchText) {
            setSearchText('');
        }
    };

    const expandAll = () => {
        if (treeRef.current) {
            try {
                treeRef.current.openAll();
            } catch (error) {
                console.error("Expand all error:", error);
            }
        }
    };

    const collapseAll = () => {
        if (treeRef.current) {
            try {
                treeRef.current.closeAll();
            } catch (error) {
                console.error("Collapse all error:", error);
            }
        }
    };

    const handleEditClick = (e: React.MouseEvent, node: any) => {
        e.stopPropagation();
        onEdit(e, null, {
            id: node.id,
            name: node.data.name,
            is_primary: node.data.is_primary,
            tree_index: node.data.index
        });
    };

    const handleDeleteClick = (e: React.MouseEvent, node: any) => {
        e.stopPropagation();
        onDelete(e, null, {
            id: node.id,
            name: node.data.name,
            is_primary: node.data.is_primary,
            tree_index: node.data.index
        });
    };

    const moveNode = (dragIds: string[], parentId: string | null, index: number) => {
        const dataCopy = JSON.parse(JSON.stringify(treeData));

        const findAndRemoveNode = (nodes: TreeNodeData[], id: string) => {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].id === id) {
                    return nodes.splice(i, 1)[0];
                }
                if (nodes[i].children && nodes[i].children.length > 0) {
                    const found = findAndRemoveNode(nodes[i].children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        const findParentNode = (nodes: TreeNodeData[], id: string | null) => {
            if (!id) return { node: null, children: nodes };

            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].id === id) {
                    if (!nodes[i].children) nodes[i].children = [];
                    return { node: nodes[i], children: nodes[i].children };
                }
                if (nodes[i].children && nodes[i].children.length > 0) {
                    const result = findParentNode(nodes[i].children, id);
                    if (result.node) return result;
                }
            }
            return { node: null, children: null };
        };

        for (const dragId of dragIds) {
            const draggedNode = findAndRemoveNode(dataCopy, dragId);
            if (!draggedNode) continue;

            const { children } = findParentNode(dataCopy, parentId);
            if (!children) continue;

            draggedNode.index = index;
            children.splice(index, 0, draggedNode);

            // Update indexes for all siblings
            children.forEach((node: TreeNodeData, idx: number) => {
                node.index = idx;
            });
        }

        return dataCopy;
    };

    const handleMove = ({ dragIds, parentId, index }: { dragIds: string[]; parentId: string | null; index: number }) => {
        console.log("Move event:", { dragIds, parentId, index });
        console.log("Current tree data before move:", JSON.stringify(treeData, null, 2));
        const updatedData = moveNode(dragIds, parentId, index);
        console.log("Updated tree data after move:", JSON.stringify(updatedData, null, 2));
        setTreeData(updatedData);
    };

    if (!treeData || treeData.length === 0) {
        return (
            <Paper elevation={1} style={{ padding: '16px' }}>
                <Typography>No hay categorías disponibles</Typography>
            </Paper>
        );
    }

    const renderNode = (props: NodeRendererProps<TreeNodeData>) => (
        <DefaultNode {...props} onEdit={handleEditClick} onDelete={handleDeleteClick} />
    );

  
    
    return (
        <><div className="dash-tree-menu" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <TextField
                variant="outlined"
                placeholder="Buscar"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleSearch();
                    }
                }}
                sx={{ flexGrow: 1 }}
                slotProps={{
                    input: {
                        //startAdornment: <SearchIcon fontSize="small" style={{ marginRight: 8 }} />,
                        endAdornment: (
                            <IconButton
                                onClick={handleSearch}
                                disabled={!searchText}
                                size="small"
                            >
                                <SearchIcon />
                            </IconButton>
                        )
                    }
                }}
            />
                    <IconButton onClick={expandAll} aria-label="Expandir Todo">
                        <ExpandMoreIcon />
                    </IconButton>
                    <IconButton onClick={collapseAll} aria-label="Colapsar Todo">
                        <ExpandLessIcon />
                    </IconButton>
                </div>

                <div 
                    ref={containerRef} 
                    style={{ 
                        display: "flex",
                        WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                    }}
                >
                {treeData.length > 0 && currentWidth ? (
                    <Tree
                        width={currentWidth}
                        height={currentHeight}
                        className="dash-tree"
                        ref={treeRef}
                        data={treeData}
                        openByDefault={true}
                        indent={24}
                        rowHeight={48} // Slightly larger for better touch targets
                        paddingTop={8}
                        paddingBottom={8}
                        searchTerm={searchText}
                        searchMatch={(node, term) => node.data.name.toLowerCase().includes(term.toLowerCase())}
                        onMove={handleMove}
                        selection="single"
                        disableDrag={false}
                        disableDrop={false}
                        //renderDragPreview={(props) => <DragPreview {...props} />}
                        renderCursor={CursorRow}
                    >
                        {renderNode}
                    </Tree>
                ) : (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "100%"
                        }}>
                        <Typography>No hay datos para mostrar</Typography>
                    </Box>
                )}
                </div></>
    );
};

export default DnDTreeGrid;