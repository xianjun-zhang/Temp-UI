import React from 'react';
import { StyledTableCell } from './DocumentStoreDetail'
import DetailChip from './DetailChip'
import { Box } from '@mui/material'

/**
 * Renders one or multiple <DetailChip> elements inside a single <StyledTableCell>.
 *
 * @param {any} data                - Can be a single value or an array of values
 * @param {string} [title]          - Fallback title if titleField is not present or item[titleField] is undefined
 * @param {string} [titleField]     - Higher-priority field name in each data item to use as title
 * @param {string} [label]          - Fallback label if labelField is not present or item[labelField] is undefined
 * @param {string} [labelField]     - Higher-priority field name in each data item to use as label
 * @param {boolean} [onStopPropagation=true] - If true, stops click event propagation on the <StyledTableCell>
 * @param {function} [onClick]      - If defined, called when <StyledTableCell> is clicked
 *
 * Priority Rules for each item (in array or single):
 *  - Title: 
 *    1) If titleField is specified and item[titleField] != undefined => use that
 *    2) Else if title is specified => use that
 *    3) Else => "None"
 *
 *  - Label:
 *    1) If labelField is specified and item[labelField] != undefined => use that
 *    2) Else if label is specified => use that
 *    3) Else => "None"
 */
export default function DetailChipsCell({
    data,
    title,
    titleField,
    label,
    labelField,
    onStopPropagation = true,
    onClick
}) {
    // Convert non-array data to an array of length 1 for unified handling
    const dataArray = Array.isArray(data) ? data : [data];

    // If there's effectively no data, show a single chip with fallback label/title
    if (
        !dataArray ||
        (dataArray.length === 1 && (dataArray[0] === null || dataArray[0] === undefined))
    ) {
        return (
            <StyledTableCell
                onClick={(e) => {
                    if (onStopPropagation) e.stopPropagation();
                    if (onClick) onClick(e);
                }}
            >
                <DetailChip
                    label={label ?? 'None'}
                    title={title ?? 'None'}
                    data={null}
                />
            </StyledTableCell>
        );
    }

    // parseItem: if you need to parse JSON strings, do so. Otherwise keep it a pass-through.
    function parseItem(item) {
        if (typeof item === 'string') {
            try {
                return JSON.parse(item);
            } catch (err) {
                // Not valid JSON, treat as a raw string
                return { _rawString: item };
            }
        }
        return item;
    }

    const chips = dataArray.map((item, idx) => {
        const parsed = parseItem(item) || {};

        // Evaluate the final title for this item
        let itemTitle = 'None';
        if (titleField && parsed[titleField] !== undefined) {
            itemTitle = parsed[titleField];
        } else if (title !== undefined) {
            itemTitle = title;
        }

        // Evaluate the final label for this item
        let itemLabel = 'None';
        if (labelField && parsed[labelField] !== undefined) {
            itemLabel = parsed[labelField];
        } else if (label !== undefined) {
            itemLabel = label;
        }

        return (
            <DetailChip
                key={idx}
                label={itemLabel}
                title={itemTitle}
                data={parsed}
            />
        );
    });

    return (
        <StyledTableCell
            onClick={(e) => {
                if (onStopPropagation) e.stopPropagation();
                if (onClick) onClick(e);
            }}
        >
            {/* 
                Use a <Box> with flex wrap and some gap to space out multiple chips 
                visually. This ensures chips don't all cram together in one line. 
            */}
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1, // 8px gap between chips
                }}
            >
                {chips}
            </Box>
        </StyledTableCell>
    );
}
