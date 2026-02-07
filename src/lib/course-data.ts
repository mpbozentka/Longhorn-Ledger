import type { TeeBox, TeeBoxInfo } from './types';

export const TEE_BOX_DATA: TeeBoxInfo[] = [
  { name: 'Texas Tees', rating: 76.7, slope: 145 },
  { name: 'Longhorn Orange', rating: 75.5, slope: 142 },
  { name: 'Harvey Penick', rating: 74.1, slope: 141 },
  { name: 'Longhorn White', rating: 73.2, slope: 136 },
  { name: 'Morris Williams', rating: 71.5, slope: 135 },
  { name: 'UT Orange (M)', rating: 70.3, slope: 131 },
  { name: 'Ed White', rating: 67.8, slope: 125 },
  { name: 'UT Orange (W)', rating: 76.6, slope: 141 },
  { name: 'Betsy Rawls', rating: 73.1, slope: 134 },
  { name: 'UT White', rating: 70.9, slope: 129 },
];

export const TEE_BOXES: TeeBox[] = TEE_BOX_DATA.map(t => t.name);

export const COURSE_DATA = {
    name: "UT Golf Club",
    holes: [
        { hole: 1, par: 4, hcpM: 17, hcpW: 9, teeBoxes: { "Texas Tees": 370, "Longhorn Orange": 366, "Harvey Penick": 366, "Longhorn White": 348, "Morris Williams": 348, "UT Orange (M)": 323, "Ed White": 313, "UT Orange (W)": 323, "Betsy Rawls": 278, "UT White": 278 } },
        { hole: 2, par: 3, hcpM: 13, hcpW: 15, teeBoxes: { "Texas Tees": 194, "Longhorn Orange": 185, "Harvey Penick": 185, "Longhorn White": 174, "Morris Williams": 174, "UT Orange (M)": 141, "Ed White": 141, "UT Orange (W)": 141, "Betsy Rawls": 141, "UT White": 112 } },
        { hole: 3, par: 4, hcpM: 5, hcpW: 5, teeBoxes: { "Texas Tees": 493, "Longhorn Orange": 458, "Harvey Penick": 392, "Longhorn White": 392, "Morris Williams": 359, "UT Orange (M)": 359, "Ed White": 314, "UT Orange (W)": 359, "Betsy Rawls": 314, "UT White": 314 } },
        { hole: 4, par: 4, hcpM: 15, hcpW: 11, teeBoxes: { "Texas Tees": 375, "Longhorn Orange": 356, "Harvey Penick": 356, "Longhorn White": 326, "Morris Williams": 326, "UT Orange (M)": 290, "Ed White": 285, "UT Orange (W)": 290, "Betsy Rawls": 290, "UT White": 254 } },
        { hole: 5, par: 4, hcpM: 1, hcpW: 1, teeBoxes: { "Texas Tees": 461, "Longhorn Orange": 459, "Harvey Penick": 436, "Longhorn White": 436, "Morris Williams": 427, "UT Orange (M)": 427, "Ed White": 390, "UT Orange (W)": 427, "Betsy Rawls": 395, "UT White": 395 } }, // Note: Par is 4/5, using 4
        { hole: 6, par: 4, hcpM: 7, hcpW: 7, teeBoxes: { "Texas Tees": 406, "Longhorn Orange": 406, "Harvey Penick": 406, "Longhorn White": 396, "Morris Williams": 396, "UT Orange (M)": 387, "Ed White": 266, "UT Orange (W)": 387, "Betsy Rawls": 266, "UT White": 266 } },
        { hole: 7, par: 4, hcpM: 3, hcpW: 13, teeBoxes: { "Texas Tees": 462, "Longhorn Orange": 431, "Harvey Penick": 409, "Longhorn White": 409, "Morris Williams": 385, "UT Orange (M)": 385, "Ed White": 251, "UT Orange (W)": 385, "Betsy Rawls": 251, "UT White": 251 } },
        { hole: 8, par: 3, hcpM: 11, hcpW: 17, teeBoxes: { "Texas Tees": 237, "Longhorn Orange": 237, "Harvey Penick": 195, "Longhorn White": 195, "Morris Williams": 159, "UT Orange (M)": 159, "Ed White": 100, "UT Orange (W)": 159, "Betsy Rawls": 100, "UT White": 100 } },
        { hole: 9, par: 5, hcpM: 9, hcpW: 3, teeBoxes: { "Texas Tees": 605, "Longhorn Orange": 580, "Harvey Penick": 580, "Longhorn White": 553, "Morris Williams": 553, "UT Orange (M)": 526, "Ed White": 526, "UT Orange (W)": 526, "Betsy Rawls": 526, "UT White": 452 } },
        { hole: 10, par: 4, hcpM: 10, hcpW: 8, teeBoxes: { "Texas Tees": 422, "Longhorn Orange": 409, "Harvey Penick": 409, "Longhorn White": 379, "Morris Williams": 379, "UT Orange (M)": 346, "Ed White": 346, "UT Orange (W)": 346, "Betsy Rawls": 346, "UT White": 310 } },
        { hole: 11, par: 5, hcpM: 6, hcpW: 6, teeBoxes: { "Texas Tees": 596, "Longhorn Orange": 579, "Harvey Penick": 560, "Longhorn White": 560, "Morris Williams": 526, "UT Orange (M)": 526, "Ed White": 526, "UT Orange (W)": 526, "Betsy Rawls": 526, "UT White": 470 } },
        { hole: 12, par: 3, hcpM: 16, hcpW: 16, teeBoxes: { "Texas Tees": 190, "Longhorn Orange": 183, "Harvey Penick": 183, "Longhorn White": 166, "Morris Williams": 166, "UT Orange (M)": 137, "Ed White": 137, "UT Orange (W)": 137, "Betsy Rawls": 137, "UT White": 111 } },
        { hole: 13, par: 4, hcpM: 18, hcpW: 10, teeBoxes: { "Texas Tees": 375, "Longhorn Orange": 363, "Harvey Penick": 363, "Longhorn White": 348, "Morris Williams": 348, "UT Orange (M)": 322, "Ed White": 322, "UT Orange (W)": 322, "Betsy Rawls": 322, "UT White": 296 } },
        { hole: 14, par: 5, hcpM: 14, hcpW: 12, teeBoxes: { "Texas Tees": 562, "Longhorn Orange": 562, "Harvey Penick": 531, "Longhorn White": 531, "Morris Williams": 495, "UT Orange (M)": 495, "Ed White": 435, "UT Orange (W)": 495, "Betsy Rawls": 435, "UT White": 435 } },
        { hole: 15, par: 4, hcpM: 2, hcpW: 2, teeBoxes: { "Texas Tees": 472, "Longhorn Orange": 437, "Harvey Penick": 408, "Longhorn White": 408, "Morris Williams": 359, "UT Orange (M)": 359, "Ed White": 327, "UT Orange (W)": 359, "Betsy Rawls": 327, "UT White": 327 } },
        { hole: 16, par: 3, hcpM: 12, hcpW: 18, teeBoxes: { "Texas Tees": 248, "Longhorn Orange": 248, "Harvey Penick": 219, "Longhorn White": 219, "Morris Williams": 186, "UT Orange (M)": 186, "Ed White": 152, "UT Orange (W)": 186, "Betsy Rawls": 152, "UT White": 106 } },
        { hole: 17, par: 4, hcpM: 8, hcpW: 14, teeBoxes: { "Texas Tees": 427, "Longhorn Orange": 400, "Harvey Penick": 400, "Longhorn White": 360, "Morris Williams": 360, "UT Orange (M)": 320, "Ed White": 320, "UT Orange (W)": 320, "Betsy Rawls": 320, "UT White": 292 } },
        { hole: 18, par: 4, hcpM: 4, hcpW: 4, teeBoxes: { "Texas Tees": 517, "Longhorn Orange": 495, "Harvey Penick": 435, "Longhorn White": 435, "Morris Williams": 417, "UT Orange (M)": 417, "Ed White": 333, "UT Orange (W)": 417, "Betsy Rawls": 333, "UT White": 333 } },
    ]
};
