import { Group, Rect, Text } from "react-konva";

function SectionBox({
  section,
  handleDragEnd,
  isExporting,
  setSelectedId,
  deleteSection,
  sections,
  setSections,
  snapToGrid,
}) {
  return (
    <Group
      x={section.x}
      y={section.y}
      draggable
      onClick={() => setSelectedId(section.id)}
      onDragEnd={(e) => {
        if (e.target.getType() === "Group") {
          handleDragEnd(e.target, section.id);
        }
      }}
    >
      <Group>
        {/* MAIN BOX */}
        <Rect
          width={section.width}
          height={section.height}
          fill="rgba(15,15,15,0.35)"
          stroke={section.color}
          strokeWidth={2}
          cornerRadius={24}
          shadowBlur={20}
        />

        {/* TITLE */}
        <Text
          text={section.title}
          x={20}
          y={20}
          fontSize={24}
          fill="white"
          fontStyle="bold"
        />

        {/* DELETE */}
          <Text
            name="delete-btn"
            text="✕"
            x={section.width - 30}
            y={12}
            fontSize={18}
            fill="#ff4d4d"
            onClick={() => deleteSection(section.id)}
          />
      </Group>

      {/* RESIZE HANDLE */}
        <Rect
          name="resize-handle"
          x={section.width - 14}
          y={section.height - 14}
          width={14}
          height={14}
          fill={section.color}
          cornerRadius={10}
          draggable
          onDragStart={(e) => {
            e.cancelBubble = true;
          }}
          onDragMove={(e) => {
            e.cancelBubble = true;

            const handleSize = 14;

            const newWidth = Math.max(e.target.x() + handleSize, 120);

            const newHeight = Math.max(e.target.y() + handleSize, 120);

            const updated = sections.map((s) => {
              if (s.id === section.id) {
                return {
                  ...s,

                  width: snapToGrid(newWidth),

                  height: snapToGrid(newHeight),
                };
              }

              return s;
            });

            setSections(updated);
          }}
          onDragEnd={(e) => {
            // RESET HANDLE POSITION
            e.target.position({
              x: snapToGrid(section.width) - 14,
              y: snapToGrid(section.height) - 14,
            });
          }}
        />
    </Group>
  );
}

export default SectionBox;
