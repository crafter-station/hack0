"use client";

import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerAreaThumb,
  ColorPickerEyeDropper,
  ColorPickerInput,
  ColorPickerSlider,
  ColorPickerSliderThumb,
  ColorPickerSwatch,
} from "@ui-sdk/react/color-picker";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@ui-sdk/react/popover";
import { type BadgeColors, CUSTOM_COLORS } from "@/lib/badge-options";

/** "Tu marca": four swatches, each opening a picker for one of the host site's colors. */
export function BadgeColorRow({ colors, onChange }: { colors: BadgeColors; onChange: (next: BadgeColors) => void }) {
  return (
    <div className="bb-colors">
      {CUSTOM_COLORS.map((c) => (
        <ColorPicker
          key={c.key}
          aria-label={c.label}
          format="hex"
          value={colors[c.key]}
          onValueChange={(value) => onChange({ ...colors, [c.key]: value })}
        >
          <Popover>
            <PopoverTrigger className="bb-color" aria-label={`${c.label}: ${colors[c.key]}`}>
              <ColorPickerSwatch className="bb-color-swatch" />
              <span>{c.label}</span>
            </PopoverTrigger>
            <PopoverContent className="bb-color-pop" side="bottom" align="start" sideOffset={8}>
              <PopoverTitle className="visually-hidden">{c.label}</PopoverTitle>
              <ColorPickerArea className="bb-cp-area">
                <ColorPickerAreaThumb className="bb-cp-thumb" />
              </ColorPickerArea>
              <ColorPickerSlider className="bb-cp-slider" channel="hue">
                <ColorPickerSliderThumb className="bb-cp-thumb" />
              </ColorPickerSlider>
              <div className="bb-cp-row">
                <ColorPickerInput className="bb-cp-input" aria-label={`${c.label} en hex`} />
                <ColorPickerEyeDropper className="bb-cp-drop" aria-label="Tomar un color de la pantalla">
                  ◎
                </ColorPickerEyeDropper>
              </div>
            </PopoverContent>
          </Popover>
        </ColorPicker>
      ))}
    </div>
  );
}
