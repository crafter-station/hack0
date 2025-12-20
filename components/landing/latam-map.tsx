"use client"

import { useMemo } from "react"
import * as d3 from "d3"
import { feature } from "topojson-client"
import { motion } from "framer-motion"
import worldData from "@/public/countries-110m.json"

interface GeoFeature {
  type: string
  geometry: any
  properties: any
}

// Latin American country IDs (ISO 3166-1 numeric codes)
const LATAM_COUNTRY_IDS = [
  "032", // Argentina
  "068", // Bolivia
  "076", // Brazil
  "152", // Chile
  "170", // Colombia
  "188", // Costa Rica
  "192", // Cuba
  "214", // Dominican Republic
  "218", // Ecuador
  "222", // El Salvador
  "320", // Guatemala
  "340", // Honduras
  "484", // Mexico
  "558", // Nicaragua
  "591", // Panama
  "600", // Paraguay
  "604", // Peru
  "858", // Uruguay
  "862", // Venezuela
]

function generateDotsInsideCountries(
  geoFeatures: GeoFeature[],
  projection: any,
  dotSpacing = 0.8,
): Array<{ x: number; y: number; id: string }> {
  const dots: Array<{ x: number; y: number; id: string }> = []

  // Latin America bounding box
  const minLon = -120
  const maxLon = -30
  const minLat = -56
  const maxLat = 33

  let index = 0
  for (let lon = minLon; lon <= maxLon; lon += dotSpacing) {
    for (let lat = minLat; lat <= maxLat; lat += dotSpacing) {
      // Check if point is inside any of the countries
      for (const geoFeature of geoFeatures) {
        if (d3.geoContains(geoFeature as any, [lon, lat])) {
          const coords = projection([lon, lat])
          if (coords && !isNaN(coords[0]) && !isNaN(coords[1])) {
            dots.push({ x: coords[0], y: coords[1], id: `dot-${index++}` })
          }
          break
        }
      }
    }
  }

  return dots
}

function AnimatedDot({
  x,
  y,
  delay,
  isHighlighted,
}: {
  x: number
  y: number
  delay: number
  isHighlighted: boolean
}) {
  return (
    <motion.circle
      cx={x}
      cy={y}
      r={isHighlighted ? 2.5 : 1.5}
      fill={isHighlighted ? "#f59e0b" : "#888888"}
      initial={{ scale: 1, opacity: 0.7 }}
      animate={{
        scale: [1, 1.6, 1],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
        delay: delay,
      }}
    />
  )
}

function StaticDot({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={1.5} fill="#888888" opacity={0.5} />
}

export function LatamMap() {
  const width = 800
  const height = 900

  const countriesData = useMemo(() => {
    const countries = feature(worldData as any, (worldData as any).objects.countries).features
    return countries.filter((c: any) => LATAM_COUNTRY_IDS.includes(c.id)) as GeoFeature[]
  }, [])

  const projection = useMemo(() => {
    return d3
      .geoEquirectangular()
      .scale(450)
      .center([-70, -15])
      .translate([width / 2, height / 2])
  }, [width, height])

  const dots = useMemo(() => {
    if (countriesData.length === 0) return []
    return generateDotsInsideCountries(countriesData, projection, 0.7)
  }, [countriesData, projection])

  const highlightedDots = useMemo(() => {
    const indices = new Set<number>()
    const numHighlighted = Math.min(30, Math.floor(dots.length * 0.04))
    while (indices.size < numHighlighted && dots.length > 0) {
      indices.add(Math.floor(Math.random() * dots.length))
    }
    return indices
  }, [dots.length])

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full bg-transparent"
        preserveAspectRatio="xMidYMid meet"
      >
        <g>
          {dots.map((dot, index) => {
            const isHighlighted = highlightedDots.has(index)
            if (isHighlighted) return null
            if (index % 3 === 0) {
              return <AnimatedDot key={dot.id} x={dot.x} y={dot.y} delay={(index % 20) * 0.15} isHighlighted={false} />
            }
            return <StaticDot key={dot.id} x={dot.x} y={dot.y} />
          })}
        </g>

        <g>
          {dots.map((dot, index) => {
            if (!highlightedDots.has(index)) return null
            return (
              <AnimatedDot
                key={`highlighted-${dot.id}`}
                x={dot.x}
                y={dot.y}
                delay={(index % 10) * 0.2}
                isHighlighted={true}
              />
            )
          })}
        </g>
      </svg>
    </div>
  )
}

export default LatamMap
