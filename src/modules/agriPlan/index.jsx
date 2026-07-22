import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { initAgriPlan, fbSaveYears, fbSaveFields, fbSaveHistRevenue, fbLoadYears, fbLoadFields, fbLoadHistRevenue, fbLoadVersion, fbSaveVersion, fbWatchFields, fbSaveRotationRules, fbLoadRotationRules } from "./firebase.js";

const HISTORY_DATA = {
  "Akey Yard|1,2":{"common":"Akey Yard","farm":"Nuxoll Land","fieldNum":"1,2","acres":11.83,"history":{"2025":"CC WW","2026":"Austrians"}},
  "Akey yard E|2":{"common":"Akey yard E","farm":"Nuxoll Land","fieldNum":"2","acres":136.29,"history":{"2025":"CC WW","2026":"Austrians"}},
  "Akey yard W|1":{"common":"Akey yard W","farm":"Nuxoll Land","fieldNum":"1","acres":157.92,"history":{"2025":"CC WW","2026":"Quinoa"}},
  "BOR|1,1,2":{"common":"BOR","farm":"Ray","fieldNum":"1,1,2","acres":32.65,"history":{"2015":"Chem-Fallow","2016":"Winter Wheat","2017":"Chem-Fallow","2018":"CC HAD","2019":"Austrians","2020":"CC WW","2021":"Mustard","2022":"Austrians","2023":"Spring Wheat","2024":"Mustard","2025":"Chickpeas","2026":"Spring Wheat"}},
  "Barn|1,2,3,4,5,6":{"common":"Barn","farm":"Ray","fieldNum":"1,2,3,4,5,6","acres":159.38,"history":{"2015":"CC HAD","2016":"Chem-Fallow","2017":"Chickpeas","2018":"CC HAD","2019":"CC WW","2020":"Green Peas","2021":"CC WW","2022":"Chickpeas","2023":"Spring Wheat","2024":"Austrians","2025":"Mustard","2026":"Chickpeas"}},
  "Beulow Rd|4":{"common":"Beulow Rd","farm":"Beulow Rd","fieldNum":"4","acres":161.57,"history":{"2021":"Chickpeas","2022":"Spring Wheat","2023":"Lentils","2024":"Spring Wheat","2025":"Chickpeas","2026":"CC HAD"}},
  "Beulow Rd|6":{"common":"Beulow Rd","farm":"Beulow Rd","fieldNum":"6","acres":484.02,"history":{"2021":"Chickpeas","2022":"Spring Wheat","2023":"Lentils","2024":"Spring Wheat","2025":"Chickpeas","2026":"CC HAD"}},
  "Block|":{"common":"Block","farm":"Duncan","fieldNum":"","acres":589.0,"history":{"2026":"Chickpeas"}},
  "Blow Field|1":{"common":"Blow Field","farm":"Ray","fieldNum":"1","acres":159.37,"history":{"2015":"Chem-Fallow","2016":"Winter Wheat","2017":"Chickpeas","2018":"CC HAD","2019":"CC WW","2020":"Lentils","2021":"Chickpeas","2022":"Spring Wheat","2023":"Lentils","2024":"Mustard","2025":"Chickpeas","2026":"Quinoa"}},
  "Cabin East|1":{"common":"Cabin East","farm":"Ray","fieldNum":"1","acres":29.84,"history":{"2017":"Chickpeas"}},
  "Cabin East|1,5":{"common":"Cabin East","farm":"Ray","fieldNum":"1,5","acres":38.06,"history":{"2015":"CRP","2016":"Austrians","2018":"CC HAD","2019":"Austrians","2020":"CC WW","2021":"Mustard","2022":"Chickpeas","2023":"Spring Wheat","2024":"Austrians","2025":"Mustard","2026":"Chickpeas"}},
  "Cabin East|2,3,4":{"common":"Cabin East","farm":"Ray","fieldNum":"2,3,4","acres":146.98,"history":{"2015":"Green Peas","2016":"CC HAD","2017":"Chickpeas","2018":"CC HAD","2019":"Austrians","2020":"CC WW","2021":"Mustard","2022":"Chickpeas","2023":"Spring Wheat","2024":"Austrians","2025":"Mustard","2026":"Chickpeas"}},
  "Cedric Section 6|1":{"common":"Cedric Section 6","farm":"Kostad Trust","fieldNum":"1","acres":155.92,"history":{"2024":"Winter Wheat","2025":"Chickpeas","2026":"Spring Wheat"}},
  "Cedric Section 6|2":{"common":"Cedric Section 6","farm":"Kostad Trust","fieldNum":"2","acres":150.82,"history":{"2024":"Chickpeas","2025":"CC HAD","2026":"Mustard"}},
  "Cedric Section 6|3":{"common":"Cedric Section 6","farm":"Kostad Trust","fieldNum":"3","acres":52.76,"history":{"2024":"Spring Wheat","2025":"Austrians","2026":"Mustard"}},
  "Cedric Section 6|4,6,8":{"common":"Cedric Section 6","farm":"Kostad Trust","fieldNum":"4,6,8","acres":153.22,"history":{"2024":"Spring Wheat","2025":"Austrians","2026":"Mustard"}},
  "Cedric Section 6|5,7":{"common":"Cedric Section 6","farm":"Kostad Trust","fieldNum":"5,7","acres":103.26,"history":{"2024":"Winter Wheat","2025":"Austrians","2026":"Mustard"}},
  "Decker Yard|1,2":{"common":"Decker Yard","farm":"Nuxoll Land","fieldNum":"1,2","acres":11.83,"history":{"2015":"CC WW","2016":"Chem-Fallow","2017":"Winter Wheat","2018":"Austrians","2019":"CC WW","2020":"Chickpeas","2021":"CC WW","2022":"Lentils","2023":"Mustard","2024":"Chickpeas"}},
  "Decker yard E|2":{"common":"Decker yard E","farm":"Nuxoll Land","fieldNum":"2","acres":136.29,"history":{"2015":"CC WW","2016":"Chem-Fallow","2017":"Winter Wheat","2018":"Austrians","2019":"CC WW","2020":"Chickpeas","2021":"CC WW","2022":"Lentils","2023":"Mustard","2024":"Chickpeas"}},
  "Decker yard W|1":{"common":"Decker yard W","farm":"Nuxoll Land","fieldNum":"1","acres":157.92,"history":{"2015":"CC WW","2016":"Chem-Fallow","2017":"Winter Wheat","2018":"Austrians","2019":"CC WW","2020":"Chickpeas","2021":"CC WW","2022":"Lentils","2023":"Mustard","2024":"Chickpeas"}},
  "East 320|":{"common":"East 320","farm":"Morkrid","fieldNum":"","acres":313.07,"history":{"2023":"Spring Wheat","2024":"Austrians","2025":"Spring Wheat","2026":"Mustard"}},
  "East 320|1":{"common":"East 320","farm":"danrather (stanley)","fieldNum":"1","acres":318.28,"history":{"2019":"Chickpeas","2020":"Spring Wheat","2021":"Green Peas","2022":"CC WW","2023":"Chickpeas","2024":"CC WW","2025":"Mustard","2026":"Austrians"}},
  "East 320|1,2":{"common":"East 320","farm":"Black Coulee","fieldNum":"1,2","acres":320.8,"history":{"2015":"CC HAD","2016":"Lentils","2017":"Chickpeas","2018":"CC HAD","2019":"Austrians","2020":"CC WW","2021":"yellow peas","2022":"CC WW","2023":"Chickpeas","2024":"Mustard","2025":"Lentils"}},
  "East Section|1,3,5":{"common":"East Section","farm":"Englund","fieldNum":"1,3,5","acres":463.45,"history":{"2016":"Winter Wheat","2017":"Austrians","2018":"CC HAD","2019":"CC WW","2020":"Chickpeas","2021":"CC WW","2022":"Lentils","2023":"Corn","2024":"Spring Wheat","2025":"Mustard","2026":"Chickpeas"}},
  "East Section|2":{"common":"East Section","farm":"Englund","fieldNum":"2","acres":111.14,"history":{"2017":"Austrians","2018":"CC HAD","2019":"CC WW","2020":"Chickpeas","2021":"CC WW","2022":"Lentils","2023":"Corn","2024":"Spring Wheat","2025":"Mustard","2026":"Chickpeas"}},
  "East Section|2,4":{"common":"East Section","farm":"Englund","fieldNum":"2,4","acres":177.7,"history":{"2016":"Chem-Fallow"}},
  "East Section|4":{"common":"East Section","farm":"Englund","fieldNum":"4","acres":66.56,"history":{"2017":"Austrians","2018":"CC HAD","2019":"CC WW","2020":"Chickpeas","2021":"CC WW","2022":"Lentils","2023":"Corn","2024":"Spring Wheat","2025":"Mustard","2026":"Chickpeas"}},
  "East Trues|1,3":{"common":"East Trues","farm":"Ray","fieldNum":"1,3","acres":245.34,"history":{"2015":"Winter Wheat","2016":"Chem-Fallow","2017":"Winter Wheat","2018":"Chickpeas","2019":"Spring Wheat","2020":"Green Peas","2021":"CC WW","2022":"yellow peas","2023":"Chickpeas","2024":"Mustard","2025":"CC WW","2026":"Lentils"}},
  "East Trues|2":{"common":"East Trues","farm":"Ray","fieldNum":"2","acres":73.64,"history":{"2015":"Chem-Fallow","2016":"Chickpeas","2017":"CC HAD","2018":"Chem-Fallow","2019":"Lentils","2020":"CC WW","2021":"Chickpeas","2022":"CC HAD","2023":"Lentils","2024":"Mustard","2025":"CC WW","2026":"Chickpeas"}},
  "East Trues|4":{"common":"East Trues","farm":"Ray","fieldNum":"4","acres":159.62,"history":{"2015":"Lentils","2016":"CC WW","2017":"Chickpeas","2018":"CC HAD","2019":"Lentils","2020":"CC WW","2021":"Chickpeas","2022":"CC HAD","2023":"Lentils","2024":"Mustard","2025":"CC WW","2026":"Chickpeas"}},
  "Henke/Hill|1,3,4":{"common":"Henke/Hill","farm":"Hunnewell","fieldNum":"1,3,4","acres":15.08,"history":{"2015":"CC WW","2016":"Chem-Fallow","2017":"Chickpeas","2018":"Chem-Fallow","2019":"Winter Wheat","2020":"Austrians","2021":"CC WW","2022":"Lentils","2023":"Mustard","2024":"Chickpeas","2025":"Spring Wheat","2026":"Mustard"}},
  "Home Place|1":{"common":"Home Place","farm":"underdal ent. (home)","fieldNum":"1","acres":149.87,"history":{"2019":"Spring Wheat","2020":"Flax","2021":"Spring Wheat","2022":"Chickpeas","2023":"CC WW","2024":"Green Peas","2025":"Barley","2026":"Lentils"}},
  "Home Place|2":{"common":"Home Place","farm":"underdal ent. (home)","fieldNum":"2","acres":249.83,"history":{"2019":"Chickpeas","2020":"Spring Wheat","2021":"Green Peas","2022":"CC WW","2023":"Chickpeas","2024":"Spring Wheat","2025":"Barley","2026":"Lentils"}},
  "House|1":{"common":"House","farm":"Home","fieldNum":"1","acres":163.56,"history":{"2015":"Green Peas","2016":"CC HAD","2017":"Winter Wheat","2018":"Chickpeas","2019":"CC WW","2020":"Lentils","2021":"Barley","2022":"Chickpeas","2023":"Mustard","2024":"CC HAD","2025":"Lentils","2026":"Chickpeas"}},
  "House|1,2,17":{"common":"House","farm":"Englund","fieldNum":"1,2,17","acres":38.25,"history":{"2016":"CRP","2017":"CRP","2018":"CRP","2019":"CRP","2020":"CRP","2021":"CRP","2022":"CRP","2023":"Chickpeas","2024":"Spring Wheat","2025":"Austrians","2026":"CC HAD"}},
  "House|2":{"common":"House","farm":"Home","fieldNum":"2","acres":155.26,"history":{"2015":"CC HAD","2016":"Winter Wheat","2017":"Winter Wheat","2018":"Chickpeas","2019":"CC WW","2020":"Lentils","2021":"Barley","2022":"Chickpeas","2023":"Mustard","2024":"CC HAD","2025":"Lentils","2026":"Chickpeas"}},
  "House|2,4-16":{"common":"House","farm":"Englund","fieldNum":"2,4-16","acres":565.69,"history":{"2016":"Lentils","2017":"Chem-Fallow","2018":"Winter Wheat","2019":"Chickpeas","2020":"CC WW","2021":"Austrians","2022":"Spring Wheat","2023":"Chickpeas","2024":"Spring Wheat","2025":"Austrians","2026":"CC HAD"}},
  "House|3":{"common":"House","farm":"Home","fieldNum":"3","acres":73.52,"history":{"2015":"Green Peas","2016":"Chem-Fallow","2017":"Winter Wheat","2018":"Chickpeas","2019":"CC WW","2020":"Lentils","2021":"Barley","2022":"Chickpeas","2023":"Mustard","2024":"CC HAD","2025":"Lentils","2026":"Chickpeas"}},
  "House|4":{"common":"House","farm":"Home","fieldNum":"4","acres":120.0,"history":{"2015":"CC HAD","2016":"Chem-Fallow","2017":"Winter Wheat","2018":"Chickpeas","2019":"CC WW","2020":"Lentils","2021":"Barley","2022":"Chickpeas","2023":"Mustard","2024":"CC HAD","2025":"Lentils","2026":"Chickpeas"}},
  "Joplin Rd|1":{"common":"Joplin Rd","farm":"Hunnewell","fieldNum":"1","acres":107.42,"history":{"2015":"Chem-Fallow"}},
  "Joplin Rd|1,2":{"common":"Joplin Rd","farm":"Hunnewell","fieldNum":"1,2","acres":395.64,"history":{"2015":"Chem-Fallow","2016":"Winter Wheat","2017":"Austrians","2018":"Chickpeas","2019":"CC HAD","2020":"Mustard","2021":"CC WW","2022":"Lentils","2023":"Mustard"}},
  "Lynch 40|1":{"common":"Lynch 40","farm":"Lynch","fieldNum":"1","acres":43.96,"history":{"2019":"Chickpeas","2020":"Spring Wheat","2021":"Green Peas","2022":"CC WW","2023":"Chickpeas","2024":"CC WW","2025":"Mustard","2026":"Austrians"}},
  "Middle section|":{"common":"Middle section","farm":"Morkrid","fieldNum":"","acres":637.59,"history":{"2023":"Spring Wheat","2024":"Lentils","2025":"Chickpeas","2026":"Spring Wheat"}},
  "N. 320|1,3":{"common":"N. 320","farm":"Englund","fieldNum":"1,3","acres":214.0,"history":{"2016":"Chem-Fallow","2017":"Chickpeas","2018":"Chem-Fallow","2019":"Winter Wheat","2020":"Green Peas","2021":"CC WW","2022":"Lentils","2023":"Mustard","2024":"Chickpeas","2025":"CC HAD","2026":"Austrians"}},
  "N. 320|2":{"common":"N. 320","farm":"Englund","fieldNum":"2","acres":105.0,"history":{"2016":"Winter Wheat","2017":"Chickpeas","2018":"Chem-Fallow","2019":"Winter Wheat","2020":"Green Peas","2021":"CC WW","2022":"Lentils","2023":"Mustard","2024":"Chickpeas","2025":"CC HAD","2026":"Austrians"}},
  "N1/2 St. Olaf|1":{"common":"N1/2 St. Olaf","farm":"danrather (home)","fieldNum":"1","acres":78.02,"history":{"2019":"Spring Wheat","2020":"Austrians","2021":"Spring Wheat","2022":"Chickpeas","2023":"CC WW","2024":"Green Peas","2025":"CC HAD","2026":"Lentils"}},
  "N1/2 St. Olaf|2":{"common":"N1/2 St. Olaf","farm":"danrather (home)","fieldNum":"2","acres":78.58,"history":{"2019":"Chickpeas","2020":"Spring Wheat","2021":"Green Peas","2022":"CC WW","2023":"Chickpeas","2024":"CC WW","2025":"Lentils","2026":"Spring Wheat"}},
  "NE 320|1":{"common":"NE 320","farm":"Sharray","fieldNum":"1","acres":165.85,"history":{"2021":"Austrians","2022":"CC WW","2023":"Chickpeas"}},
  "NE 320|2":{"common":"NE 320","farm":"Sharray","fieldNum":"2","acres":165.05,"history":{"2021":"Winter Wheat","2022":"yellow peas","2023":"Chickpeas"}},
  "NW 320|1":{"common":"NW 320","farm":"Sharray","fieldNum":"1","acres":144.36,"history":{"2021":"Austrians","2022":"CC WW","2023":"Chickpeas"}},
  "NW 320|2":{"common":"NW 320","farm":"Sharray","fieldNum":"2","acres":150.24,"history":{"2021":"Winter Wheat","2022":"yellow peas","2023":"Chickpeas"}},
  "North 320|":{"common":"North 320","farm":"Morkrid","fieldNum":"","acres":320.75,"history":{"2023":"Mustard","2024":"Lentils","2025":"Chickpeas","2026":"Spring Wheat"}},
  "North 320|1":{"common":"North 320","farm":"Nuxoll Land","fieldNum":"1","acres":313.61,"history":{"2015":"CC WW","2016":"Green Peas","2017":"CC HAD","2018":"Chickpeas","2019":"Oats"}},
  "North 320|1,2,3":{"common":"North 320","farm":"Home","fieldNum":"1,2,3","acres":314.79,"history":{"2015":"Chem-Fallow","2016":"Winter Wheat"}},
  "North 320|1-2,1":{"common":"North 320","farm":"Black Coulee","fieldNum":"1-2,1","acres":322.89,"history":{"2015":"CC HAD","2016":"Chickpeas","2017":"Chem-Fallow","2018":"Winter Wheat","2019":"Lentils","2020":"CC WW","2021":"yellow peas","2022":"CC WW","2023":"Chickpeas","2024":"Mustard","2025":"Lentils"}},
  "North Building site|1":{"common":"North Building site","farm":"underdal ent.(missile)","fieldNum":"1","acres":36.3,"history":{"2019":"Austrians","2020":"Spring Wheat","2021":"Mustard"}},
  "North Building site|1 (west 1)":{"common":"North Building site","farm":"underdal ent.(missile)","fieldNum":"1 (west 1)","acres":36.3,"history":{"2022":"CC WW","2023":"Austrians","2024":"Spring Wheat","2025":"Lentils","2026":"Spring Wheat"}},
  "North Cabin|1,2,3,4,5":{"common":"North Cabin","farm":"Ray","fieldNum":"1,2,3,4,5","acres":315.25,"history":{"2015":"Winter Wheat","2016":"Chem-Fallow","2017":"Chickpeas","2018":"CC HAD","2019":"Lentils","2020":"CC WW","2021":"Chickpeas","2022":"CC WW","2023":"Austrians","2024":"Spring Wheat","2025":"Chickpeas","2026":"CC HAD"}},
  "North Hendrickson|1,2":{"common":"North Hendrickson","farm":"Home","fieldNum":"1,2","acres":159.42,"history":{"2015":"Chem-Fallow","2016":"Winter Wheat","2017":"Lentils","2018":"Mustard","2019":"Chickpeas","2020":"CC WW","2021":"yellow peas","2022":"CC WW","2023":"Chickpeas","2024":"Mustard","2025":"Austrians","2026":"CC HAD"}},
  "North Hendrickson|1,3":{"common":"North Hendrickson","farm":"Home","fieldNum":"1,3","acres":160.49,"history":{"2015":"Chem-Fallow","2016":"Winter Wheat","2017":"Lentils","2018":"Mustard","2019":"Chickpeas","2020":"CC WW","2021":"yellow peas","2022":"CC WW","2023":"Chickpeas","2024":"Mustard","2025":"Austrians","2026":"CC HAD"}},
  "North Henke|1,2":{"common":"North Henke","farm":"Hunnewell","fieldNum":"1,2","acres":15.04,"history":{"2015":"Winter Wheat","2016":"Chem-Fallow","2017":"Winter Wheat","2018":"Austrians","2019":"CC WW","2020":"Chickpeas","2021":"CC WW","2022":"Mustard","2023":"Spring Wheat","2024":"Chickpeas","2025":"Spring Wheat","2026":"Mustard"}},
  "North Kammer|1":{"common":"North Kammer","farm":"Hunnewell","fieldNum":"1","acres":318.11,"history":{"2015":"Winter Wheat","2016":"Chem-Fallow","2017":"Winter Wheat","2018":"Chickpeas","2019":"CC WW","2020":"Yellow Peas","2021":"CC WW","2022":"Chickpeas","2023":"Spring Wheat","2024":"Lentils","2025":"Mustard","2026":"Chickpeas"}},
  "North Kirby|1":{"common":"North Kirby","farm":"danrather (missile)","fieldNum":"1","acres":155.4,"history":{"2019":"Spring Wheat","2020":"Austrians","2021":"Spring Wheat","2022":"Chickpeas","2023":"CC WW","2024":"Green Peas","2025":"CC HAD","2026":"Chickpeas"}},
  "North Rd|1,2,1,2,3,1-3":{"common":"North Rd","farm":"Brown","fieldNum":"1,2,1,2,3,1-3","acres":383.18,"history":{"2015":"Chem-Fallow","2016":"Winter Wheat","2017":"Chem-Fallow","2018":"Austrians","2019":"CC WW","2020":"Chickpeas","2021":"CC WW","2022":"Mustard","2023":"Spring Wheat","2024":"Chickpeas","2025":"Spring Wheat","2026":"Mustard"}},
  "North Tiber Grade|1,2,3":{"common":"North Tiber Grade","farm":"Home","fieldNum":"1,2,3","acres":314.79,"history":{"2017":"Lentils","2018":"Chickpeas","2019":"CC WW","2020":"Yellow Peas","2021":"Barley","2022":"Chickpeas","2023":"Spring Wheat","2024":"Lentils","2025":"CC HAD","2026":"Chickpeas"}},
  "North Wanken|1":{"common":"North Wanken","farm":"Home","fieldNum":"1","acres":317.98,"history":{"2015":"Yellow Peas","2016":"CC HAD","2017":"Chem-Fallow","2018":"Lentils","2019":"CC WW","2020":"Chickpeas","2021":"Barley","2022":"Austrians","2023":"Mustard","2024":"CC WW","2025":"Chickpeas","2026":"Flax"}},
  "Northwest 640|1":{"common":"Northwest 640","farm":"Spingola","fieldNum":"1","acres":637.77,"history":{"2019":"Mustard","2020":"CC WW","2021":"Chickpeas"}},
  "Old House West|1":{"common":"Old House West","farm":"danrather (missile)","fieldNum":"1","acres":159.24,"history":{"2019":"Spring Wheat","2020":"Austrians","2021":"Spring Wheat","2022":"Chickpeas","2023":"CC WW","2024":"Green Peas","2025":"CC WW","2026":"Chickpeas"}},
  "Pivot CRP|1":{"common":"Pivot CRP","farm":"Ray","fieldNum":"1","acres":24.89,"history":{"2016":"Austrians","2017":"Chem-Fallow","2018":"Mustard","2019":"Austrians","2020":"Flax","2021":"Spring Wheat","2022":"yellow peas","2023":"Chem-Fallow","2024":"Corn","2025":"Austrians","2026":"Cover Crop"}},
  "Pivot|1":{"common":"Pivot","farm":"Ray","fieldNum":"1","acres":24.89,"history":{"2015":"CRP"}},
  "Pivot|2":{"common":"Pivot","farm":"Ray","fieldNum":"2","acres":69.96,"history":{"2015":"Green Peas","2016":"CC HAD","2017":"Chickpeas","2018":"Mustard","2019":"Austrians","2020":"Flax","2021":"Spring Wheat","2022":"Hemp","2023":"Corn","2024":"Corn","2025":"Austrians","2026":"Cover Crop"}},
  "Rock Hilltop|1":{"common":"Rock Hilltop","farm":"underdal ent.(missile)","fieldNum":"1","acres":40.76,"history":{"2019":"Spring Wheat","2020":"Austrians","2021":"Spring Wheat"}},
  "Rock Hilltop|1 (west 6)":{"common":"Rock Hilltop","farm":"underdal ent.(missile)","fieldNum":"1 (west 6)","acres":40.76,"history":{"2022":"Chickpeas","2023":"CC WW","2024":"Green Peas","2025":"CC WW","2026":"Austrians"}},
  "Rock Hilltop|2":{"common":"Rock Hilltop","farm":"underdal ent.(missile)","fieldNum":"2","acres":40.66,"history":{"2019":"Austrians","2020":"Spring Wheat","2021":"Chickpeas"}},
  "Rock Hilltop|2 (west 5)":{"common":"Rock Hilltop","farm":"underdal ent.(missile)","fieldNum":"2 (west 5)","acres":40.66,"history":{"2022":"Spring Wheat","2023":"Austrians","2024":"CC WW","2025":"Lentils","2026":"Spring Wheat"}},
  "S1/2 St. Olaf|1":{"common":"S1/2 St. Olaf","farm":"underdal ent. (home)","fieldNum":"1","acres":79.26,"history":{"2019":"Spring Wheat","2020":"Austrians","2021":"Spring Wheat","2022":"Chickpeas","2023":"CC WW","2024":"Green Peas","2025":"CC HAD","2026":"Lentils"}},
  "S1/2 St. Olaf|2":{"common":"S1/2 St. Olaf","farm":"underdal ent. (home)","fieldNum":"2","acres":80.92,"history":{"2019":"Chickpeas","2020":"Spring Wheat","2021":"Green Peas","2022":"CC WW","2023":"Chickpeas","2024":"CC WW","2025":"Lentils","2026":"Spring Wheat"}},
  "SE 320|1,3":{"common":"SE 320","farm":"Sharray","fieldNum":"1,3","acres":157.68,"history":{"2021":"Austrians","2022":"CC WW","2023":"Spring Wheat"}},
  "SE 320|2,4":{"common":"SE 320","farm":"Sharray","fieldNum":"2,4","acres":157.66,"history":{"2021":"Winter Wheat","2022":"yellow peas","2023":"Spring Wheat"}},
  "STATE north|1,2":{"common":"STATE north","farm":"Brown","fieldNum":"1,2","acres":221.26,"history":{"2025":"Spring Wheat","2026":"Mustard"}},
  "STATE|1,2":{"common":"STATE","farm":"Brown","fieldNum":"1,2","acres":72.99,"history":{"2015":"Chem-Fallow","2016":"Winter Wheat","2017":"Sunflowers","2018":"CC HAD","2019":"CC WW","2020":"Chickpeas","2021":"CC WW","2022":"Mustard","2023":"Spring Wheat","2024":"Chickpeas","2025":"Spring Wheat","2026":"Mustard"}},
  "STATE|1,2,3,4,5,6":{"common":"STATE","farm":"Ray","fieldNum":"1,2,3,4,5,6","acres":72.24,"history":{"2015":"CC HAD","2016":"Chem-Fallow","2017":"CC HAD","2018":"CC HAD","2019":"CC WW","2020":"Green Peas","2021":"CC WW","2022":"Chickpeas","2023":"Spring Wheat","2024":"Austrians","2025":"Mustard","2026":"Chickpeas"}},
  "SW 320|1":{"common":"SW 320","farm":"Sharray","fieldNum":"1","acres":151.25,"history":{"2021":"Austrians","2022":"CC WW","2023":"Spring Wheat"}},
  "SW 320|2,3":{"common":"SW 320","farm":"Sharray","fieldNum":"2,3","acres":140.79,"history":{"2021":"Winter Wheat","2022":"yellow peas","2023":"Spring Wheat"}},
  "Shotgun Slough|1":{"common":"Shotgun Slough","farm":"danrather (stanley)","fieldNum":"1","acres":161.11,"history":{"2019":"Chickpeas","2020":"Spring Wheat","2021":"Green Peas","2022":"CC WW","2023":"CC WW","2024":"Lentils","2025":"Mustard","2026":"Austrians"}},
  "South 480|1":{"common":"South 480","farm":"Nuxoll Land","fieldNum":"1","acres":157.31,"history":{"2015":"CC WW","2016":"Lentils","2017":"Chickpeas","2018":"CC HAD","2019":"Flax"}},
  "South House Section|1":{"common":"South House Section","farm":"underdal ent. (home)","fieldNum":"1","acres":306.79,"history":{"2019":"Spring Wheat","2020":"Chickpeas","2021":"Spring Wheat","2022":"Austrians","2023":"CC WW","2024":"Chickpeas","2025":"CC HAD","2026":"Green Peas"}},
  "South House Section|2":{"common":"South House Section","farm":"underdal ent. (home)","fieldNum":"2","acres":331.84,"history":{"2019":"Chickpeas","2020":"Spring Wheat","2021":"Green Peas","2022":"CC WW","2023":"Chickpeas","2024":"CC WW","2025":"Mustard","2026":"Spring Wheat"}},
  "South House|1,2":{"common":"South House","farm":"Home","fieldNum":"1,2","acres":205.52,"history":{"2015":"Winter Wheat","2016":"Winter Wheat","2017":"Winter Wheat","2018":"Chickpeas","2019":"Spring Wheat","2020":"Lentils","2021":"CC WW","2022":"Flax","2023":"Chickpeas","2024":"Mustard","2025":"Spring Wheat","2026":"Oats"}},
  "South House|3,4,5":{"common":"South House","farm":"Home","fieldNum":"3,4,5","acres":233.95,"history":{"2015":"Winter Wheat","2016":"Chem-Fallow","2017":"Winter Wheat","2018":"Chickpeas","2019":"Spring Wheat","2020":"Lentils","2021":"CC WW","2022":"Flax","2023":"Chickpeas","2024":"Mustard","2025":"Spring Wheat","2026":"Oats"}},
  "South House|6":{"common":"South House","farm":"Home","fieldNum":"6","acres":156.62,"history":{"2015":"Yellow Peas"}},
  "South Kirby corner|1":{"common":"South Kirby corner","farm":"danrather (missile)","fieldNum":"1","acres":75.57,"history":{"2019":"Spring Wheat","2020":"Austrians","2021":"Spring Wheat","2022":"Chickpeas","2023":"CC WW","2024":"Green Peas","2025":"CC WW","2026":"Chickpeas"}},
  "South Poles|6":{"common":"South Poles","farm":"Home","fieldNum":"6","acres":156.62,"history":{"2016":"Chickpeas","2017":"CC HAD","2018":"Lentils","2019":"Spring Wheat","2020":"Chickpeas","2021":"Spring Wheat","2022":"Flax","2023":"Lentils","2024":"Mustard","2025":"Spring Wheat","2026":"Oats"}},
  "South Rd.|1-2,1-4":{"common":"South Rd.","farm":"Brown","fieldNum":"1-2,1-4","acres":287.43,"history":{"2015":"CC HAD","2016":"Chem-Fallow","2017":"Sunflowers","2018":"Austrians","2019":"CC WW","2020":"Chickpeas","2021":"CC WW","2022":"Lentils","2023":"Spring Wheat","2024":"Mustard","2025":"Chickpeas","2026":"Spring Wheat"}},
  "South Rock Hilltop|1":{"common":"South Rock Hilltop","farm":"underdal ent.(missile)","fieldNum":"1","acres":79.34,"history":{"2019":"Spring Wheat","2020":"Austrians","2021":"Spring Wheat"}},
  "South Rock Hilltop|1 (west 6)":{"common":"South Rock Hilltop","farm":"underdal ent.(missile)","fieldNum":"1 (west 6)","acres":79.34,"history":{"2022":"Chickpeas","2023":"CC WW","2024":"Green Peas","2025":"CC WW","2026":"Austrians"}},
  "South Rock Hilltop|2":{"common":"South Rock Hilltop","farm":"underdal ent.(missile)","fieldNum":"2","acres":79.01,"history":{"2019":"Austrians","2020":"Spring Wheat","2021":"Chickpeas"}},
  "South Rock Hilltop|2 (west 5)":{"common":"South Rock Hilltop","farm":"underdal ent.(missile)","fieldNum":"2 (west 5)","acres":79.01,"history":{"2022":"Spring Wheat","2023":"Austrians","2024":"CC WW","2025":"Lentils","2026":"Spring Wheat"}},
  "South Shotgun|1":{"common":"South Shotgun","farm":"danrather (stanley)","fieldNum":"1","acres":320.85,"history":{"2019":"Spring Wheat","2020":"Chickpeas","2021":"Spring Wheat","2022":"Austrians","2023":"CC WW","2024":"Lentils","2025":"CC WW","2026":"Mustard"}},
  "South Shotgun|2":{"common":"South Shotgun","farm":"danrather (stanley)","fieldNum":"2","acres":273.23,"history":{"2019":"Chickpeas","2020":"Spring Wheat","2021":"Green Peas","2022":"CC WW","2023":"Chickpeas","2024":"CC WW","2025":"Mustard","2026":"Austrians"}},
  "Southwest 640|1":{"common":"Southwest 640","farm":"Spingola","fieldNum":"1","acres":621.71,"history":{"2019":"Flax","2020":"CC WW","2021":"Chickpeas"}},
  "Trues|1":{"common":"Trues","farm":"Ray","fieldNum":"1","acres":191.27,"history":{"2016":"Chickpeas","2017":"CC HAD","2018":"Chem-Fallow","2019":"Winter Wheat","2020":"Austrians","2021":"Flax","2022":"CC HAD","2023":"Chickpeas","2024":"CC HAD","2025":"Lentils","2026":"Mustard"}},
  "Trues|1,3,4":{"common":"Trues","farm":"Ray","fieldNum":"1,3,4","acres":62.0,"history":{"2015":"Chem-Fallow","2016":"Winter Wheat","2017":"Chem-Fallow","2018":"Chickpeas","2019":"CC WW","2020":"Austrians","2021":"Spring Wheat","2022":"Chickpeas","2023":"Spring Wheat","2024":"Canola","2025":"Lentils","2026":"Chickpeas"}},
  "Trues|2":{"common":"Trues","farm":"Ray","fieldNum":"2","acres":117.1,"history":{"2015":"CC HAD","2016":"Chem-Fallow","2017":"Winter Wheat","2018":"Chickpeas","2019":"CC WW","2020":"Austrians","2021":"Flax","2022":"CC HAD","2023":"Chickpeas","2024":"CC HAD","2025":"Lentils","2026":"Mustard"}},
  "Trues|3,4":{"common":"Trues","farm":"Ray","fieldNum":"3,4","acres":97.0,"history":{"2016":"CC HAD","2017":"Chem-Fallow","2018":"Chickpeas","2019":"CC WW","2020":"Austrians","2021":"Spring Wheat","2022":"Chickpeas","2023":"Spring Wheat","2024":"Canola","2025":"Lentils","2026":"Chickpeas"}},
  "Watson NorthWest|1":{"common":"Watson NorthWest","farm":"Chris Kolstad","fieldNum":"1","acres":40.3,"history":{"2024":"Winter Wheat","2025":"Chickpeas","2026":"CC HAD"}},
  "Watson North|1,3,5":{"common":"Watson North","farm":"Chris Kolstad","fieldNum":"1,3,5","acres":313.84,"history":{"2024":"Chickpeas","2025":"CC HAD"}},
  "Watson North|123":{"common":"Watson North","farm":"Chris Kolstad","fieldNum":"123","acres":313.84,"history":{"2026":"Barley"}},
  "Watson North|2,4,6":{"common":"Watson North","farm":"Chris Kolstad","fieldNum":"2,4,6","acres":314.12,"history":{"2024":"Winter Wheat","2025":"Chickpeas"}},
  "Watson North|456":{"common":"Watson North","farm":"Chris Kolstad","fieldNum":"456","acres":314.12,"history":{"2026":"Spring Wheat"}},
  "Watson SouthEast|1":{"common":"Watson SouthEast","farm":"Chris Kolstad","fieldNum":"1","acres":75.29,"history":{"2024":"Chickpeas","2025":"CC HAD","2026":"Barley"}},
  "Watson SouthEast|2":{"common":"Watson SouthEast","farm":"Chris Kolstad","fieldNum":"2","acres":83.53,"history":{"2024":"Winter Wheat","2025":"Chickpeas","2026":"Barley"}},
  "Watson South|1,3,5":{"common":"Watson South","farm":"Chris Kolstad","fieldNum":"1,3,5","acres":157.99,"history":{"2024":"Chickpeas","2025":"CC HAD"}},
  "Watson South|123":{"common":"Watson South","farm":"Chris Kolstad","fieldNum":"123","acres":157.99,"history":{"2026":"Barley"}},
  "Watson South|2,4,6":{"common":"Watson South","farm":"Chris Kolstad","fieldNum":"2,4,6","acres":157.36,"history":{"2024":"Winter Wheat","2025":"Chickpeas"}},
  "Watson South|456":{"common":"Watson South","farm":"Chris Kolstad","fieldNum":"456","acres":157.36,"history":{"2026":"Spring Wheat"}},
  "Watson West|1,6":{"common":"Watson West","farm":"Chris Kolstad","fieldNum":"1,6","acres":395.12,"history":{"2024":"Winter Wheat","2025":"Chickpeas","2026":"CC HAD"}},
  "Watson West|2,3,4,5":{"common":"Watson West","farm":"Chris Kolstad","fieldNum":"2,3,4,5","acres":218.43,"history":{"2024":"Chickpeas","2025":"CC HAD","2026":"CC HAD"}},
  "West 120's|1":{"common":"West 120's","farm":"Home","fieldNum":"1","acres":116.77,"history":{"2022":"Corn","2023":"Spring Wheat","2024":"Lentils","2025":"Mustard","2026":"Chickpeas"}},
  "West 120's|1,3":{"common":"West 120's","farm":"Home","fieldNum":"1,3","acres":233.75,"history":{"2015":"Winter Wheat","2016":"Chem-Fallow","2017":"Winter Wheat","2018":"Chickpeas","2019":"CC WW","2020":"Yellow Peas","2021":"CC WW"}},
  "West 120's|2":{"common":"West 120's","farm":"Home","fieldNum":"2","acres":122.26,"history":{"2015":"CC HAD","2016":"Chem-Fallow","2017":"Winter Wheat","2018":"Chickpeas","2019":"CC WW","2020":"Yellow Peas","2021":"CC WW"}},
  "West 120's|2,3":{"common":"West 120's","farm":"Home","fieldNum":"2,3","acres":239.24,"history":{"2022":"Chickpeas","2023":"Spring Wheat","2024":"Lentils","2025":"Mustard","2026":"Chickpeas"}},
  "West 120's|4":{"common":"West 120's","farm":"Home","fieldNum":"4","acres":122.87,"history":{"2015":"Chem-Fallow","2016":"Winter Wheat","2017":"Chem-Fallow","2018":"Lentils","2019":"CC WW","2020":"Lentils","2021":"CC WW","2022":"Chickpeas","2023":"Spring Wheat","2024":"Lentils","2025":"Mustard","2026":"Chickpeas"}},
  "West 200|1":{"common":"West 200","farm":"danrather (stanley)","fieldNum":"1","acres":202.11,"history":{"2019":"Spring Wheat","2020":"Chickpeas","2021":"Spring Wheat","2022":"Austrians","2023":"CC WW","2024":"Lentils","2025":"CC WW","2026":"Mustard"}},
  "West 280|":{"common":"West 280","farm":"Morkrid","fieldNum":"","acres":278.5,"history":{"2023":"Spring Wheat","2024":"Chickpeas","2025":"Spring Wheat","2026":"Mustard"}},
  "West 320|1,2,3":{"common":"West 320","farm":"Black Coulee","fieldNum":"1,2,3","acres":328.33,"history":{"2015":"CC HAD","2016":"Lentils","2017":"Chickpeas","2018":"CC HAD","2019":"Austrians","2020":"CC WW","2021":"yellow peas","2022":"CC WW","2023":"Chickpeas","2024":"Mustard","2025":"Lentils"}},
  "West 50s|1,2,3,4,5,6":{"common":"West 50s","farm":"Home","fieldNum":"1,2,3,4,5,6","acres":315.47,"history":{"2015":"Chem-Fallow","2016":"Winter Wheat","2017":"Yellow Peas","2018":"Chickpeas","2019":"CC WW","2020":"Yellow Peas","2021":"CC WW","2022":"Chickpeas","2023":"Spring Wheat","2024":"Mustard","2025":"CC WW","2026":"Chickpeas"}},
  "West CRP|1,2,3,4":{"common":"West CRP","farm":"Ray","fieldNum":"1,2,3,4","acres":206.06,"history":{"2015":"CRP","2016":"Austrians","2017":"Chem-Fallow","2018":"Winter Wheat","2019":"Chickpeas","2020":"CC WW","2021":"yellow peas","2022":"CC WW","2023":"Chickpeas","2024":"Mustard","2025":"Lentils","2026":"Spring Wheat"}},
  "West Joplin Road|1":{"common":"West Joplin Road","farm":"Sharray","fieldNum":"1","acres":158.84,"history":{"2021":"Austrians","2022":"CC WW","2023":"Chickpeas","2024":"Spring Wheat","2025":"Mustard","2026":"Green Peas"}},
  "West Joplin Road|2":{"common":"West Joplin Road","farm":"Sharray","fieldNum":"2","acres":158.29,"history":{"2021":"Winter Wheat","2022":"yellow peas","2023":"Chickpeas","2024":"Spring Wheat","2025":"Mustard","2026":"Green Peas"}},
  "West Section|1,10":{"common":"West Section","farm":"Englund","fieldNum":"1,10","acres":81.61,"history":{"2016":"CRP","2017":"CRP","2018":"CRP","2019":"CRP","2020":"CRP","2021":"CRP","2022":"CRP","2023":"Austrians","2024":"Mustard","2025":"Chickpeas","2026":"CC HAD"}},
  "West Section|11":{"common":"West Section","farm":"Englund","fieldNum":"11","acres":9.76,"history":{"2016":"Chem-Fallow","2017":"Chem-Fallow","2018":"Winter Wheat","2019":"Lentils","2020":"CC WW","2021":"Chickpeas","2022":"Spring Wheat","2023":"Austrians","2024":"Mustard","2025":"Chickpeas","2026":"CC HAD"}},
  "West Section|2,3,4,6,7,8":{"common":"West Section","farm":"Englund","fieldNum":"2,3,4,6,7,8","acres":221.43,"history":{"2016":"CC HAD","2017":"Chem-Fallow","2018":"Winter Wheat","2019":"Lentils","2020":"CC WW","2021":"Chickpeas","2022":"Spring Wheat","2023":"Austrians","2024":"Mustard","2025":"Chickpeas","2026":"CC HAD"}},
  "West Section|2,3,7,8":{"common":"West Section","farm":"Englund","fieldNum":"2,3,7,8","acres":91.0,"history":{"2016":"Chickpeas","2017":"Chem-Fallow","2018":"Winter Wheat","2019":"Lentils","2020":"CC WW","2021":"Chickpeas","2022":"Spring Wheat","2023":"Austrians","2024":"Mustard","2025":"Chickpeas","2026":"CC HAD"}},
  "West Section|4,5,6":{"common":"West Section","farm":"Englund","fieldNum":"4,5,6","acres":165.4,"history":{"2016":"Winter Wheat","2017":"Chem-Fallow","2018":"Winter Wheat","2019":"Lentils","2020":"CC WW","2021":"Chickpeas","2022":"Spring Wheat","2023":"Austrians","2024":"Mustard","2025":"Chickpeas","2026":"CC HAD"}},
  "West Section|9":{"common":"West Section","farm":"Englund","fieldNum":"9","acres":63.55,"history":{"2016":"Chickpeas","2017":"Chem-Fallow","2018":"Winter Wheat","2019":"Lentils","2020":"CC WW","2021":"Chickpeas","2022":"Spring Wheat","2023":"Austrians","2024":"Mustard","2025":"Chickpeas","2026":"CC HAD"}},
  "West Trues|1":{"common":"West Trues","farm":"Ray","fieldNum":"1","acres":44.27,"history":{"2015":"Chem-Fallow","2016":"Chickpeas","2017":"CC HAD","2018":"Chem-Fallow","2019":"Winter Wheat","2020":"Austrians","2021":"Flax","2022":"CC HAD","2023":"Chickpeas","2024":"CC HAD","2025":"Lentils","2026":"Mustard"}},
  "West Trues|2":{"common":"West Trues","farm":"Ray","fieldNum":"2","acres":38.42,"history":{"2015":"CC HAD","2016":"Chem-Fallow","2017":"Winter Wheat","2018":"Chickpeas","2019":"CC WW","2020":"Austrians","2021":"Flax","2022":"CC HAD","2023":"Chickpeas","2024":"CC HAD","2025":"Lentils","2026":"Mustard"}},
  "West building site|1":{"common":"West building site","farm":"underdal ent.(missile)","fieldNum":"1","acres":39.3,"history":{"2019":"Spring Wheat","2020":"Chickpeas","2021":"Spring Wheat"}},
  "West building site|1 (west 4)":{"common":"West building site","farm":"underdal ent.(missile)","fieldNum":"1 (west 4)","acres":39.3,"history":{"2022":"Green Peas","2023":"CC WW","2024":"Chickpeas","2025":"CC HAD","2026":"Green Peas"}},
  "West building site|2":{"common":"West building site","farm":"underdal ent.(missile)","fieldNum":"2","acres":41.02,"history":{"2019":"Austrians","2020":"Spring Wheat","2021":"Chickpeas"}},
  "West building site|2 (west 3)":{"common":"West building site","farm":"underdal ent.(missile)","fieldNum":"2 (west 3)","acres":41.02,"history":{"2022":"Spring Wheat","2023":"Austrians","2024":"CC WW","2025":"Lentils","2026":"Spring Wheat"}},
  "chemfallow|1":{"common":"chemfallow","farm":"SHARAY","fieldNum":"1","acres":772.03,"history":{"2020":"Chem-Fallow"}},
  "east of block|":{"common":"east of block","farm":"Duncan","fieldNum":"","acres":320.0,"history":{"2026":"Chickpeas"}},
  "far west north place|1":{"common":"far west north place","farm":"danrather (missile)","fieldNum":"1","acres":237.93,"history":{"2019":"Spring Wheat","2020":"Austrians","2021":"Spring Wheat"}},
  "far west north place|1 (west 6)":{"common":"far west north place","farm":"danrather (missile)","fieldNum":"1 (west 6)","acres":237.93,"history":{"2022":"Chickpeas","2023":"CC WW","2024":"Green Peas","2025":"CC WW","2026":"Austrians"}},
  "far west north place|2":{"common":"far west north place","farm":"danrather (missile)","fieldNum":"2","acres":78.77,"history":{"2019":"Austrians","2020":"Spring Wheat","2021":"Chickpeas"}},
  "far west north place|2 (west 5)":{"common":"far west north place","farm":"danrather (missile)","fieldNum":"2 (west 5)","acres":78.77,"history":{"2022":"Spring Wheat","2023":"Austrians","2024":"CC WW","2025":"Lentils","2026":"Spring Wheat"}},
  "island|1":{"common":"island","farm":"Ray","fieldNum":"1","acres":8.9,"history":{"2015":"CRP","2016":"Austrians","2017":"Chem-Fallow","2018":"CC HAD","2019":"Austrians","2020":"CC WW","2021":"Mustard","2022":"Austrians","2023":"Spring Wheat","2024":"Mustard","2025":"Chickpeas","2026":"Spring Wheat"}},
  "island|5":{"common":"island","farm":"Ray","fieldNum":"5","acres":8.22,"history":{"2017":"Chem-Fallow"}},
  "north rock hill|1":{"common":"north rock hill","farm":"state","fieldNum":"1","acres":8.04,"history":{"2019":"Spring Wheat","2020":"Austrians","2021":"Spring Wheat"}},
  "north rock hill|1 (west 6)":{"common":"north rock hill","farm":"state","fieldNum":"1 (west 6)","acres":8.04,"history":{"2022":"Chickpeas","2023":"CC WW","2024":"Green Peas","2025":"CC WW","2026":"Austrians"}},
  "north rock hill|2":{"common":"north rock hill","farm":"state","fieldNum":"2","acres":28.86,"history":{"2019":"Austrians","2020":"Spring Wheat","2021":"Chickpeas"}},
  "north rock hill|2 (west 5)":{"common":"north rock hill","farm":"state","fieldNum":"2 (west 5)","acres":28.86,"history":{"2022":"Spring Wheat","2023":"Austrians","2024":"CC WW","2025":"Lentils","2026":"Spring Wheat"}},
  "north|":{"common":"north","farm":"Lothair","fieldNum":"","acres":311.9,"history":{"2026":"Chickpeas"}},
  "south eastside|":{"common":"south eastside","farm":"Lothair","fieldNum":"","acres":155.7,"history":{"2026":"Barley"}},
  "south state 320|1":{"common":"south state 320","farm":"state","fieldNum":"1","acres":154.45,"history":{"2019":"Spring Wheat","2020":"Chickpeas","2021":"Spring Wheat"}},
  "south state 320|1 (west 4)":{"common":"south state 320","farm":"state","fieldNum":"1 (west 4)","acres":154.45,"history":{"2022":"Green Peas","2023":"CC WW","2024":"Chickpeas","2025":"CC HAD","2026":"Green Peas"}},
  "south state 320|2":{"common":"south state 320","farm":"state","fieldNum":"2","acres":158.76,"history":{"2021":"Chickpeas"}},
  "south state 320|2 (west 3)":{"common":"south state 320","farm":"state","fieldNum":"2 (west 3)","acres":158.76,"history":{"2022":"Spring Wheat","2023":"Austrians","2024":"CC WW","2025":"Lentils","2026":"Spring Wheat"}},
  "south state 321|2":{"common":"south state 321","farm":"state","fieldNum":"2","acres":158.76,"history":{"2019":"Austrians","2020":"Spring Wheat"}},
  "south westside|":{"common":"south westside","farm":"Lothair","fieldNum":"","acres":158.2,"history":{"2026":"Chickpeas"}},
  "tracking at|":{"common":"tracking at","farm":"=SUM(M5:M75)","fieldNum":"","acres":2900.0,"history":{"2018":"Leaders"}},
  "west Hauser Rd.|1":{"common":"west Hauser Rd.","farm":"underdal ent.(missile)","fieldNum":"1","acres":154.44,"history":{"2019":"Spring Wheat","2020":"Chickpeas","2021":"Spring Wheat"}},
  "west Hauser Rd.|1 (west 2)":{"common":"west Hauser Rd.","farm":"underdal ent.(missile)","fieldNum":"1 (west 2)","acres":154.44,"history":{"2022":"Green Peas","2023":"CC WW","2024":"Chickpeas","2025":"CC HAD","2026":"Green Peas"}},
  "west Hauser Rd.|2":{"common":"west Hauser Rd.","farm":"underdal ent.(missile)","fieldNum":"2","acres":158.66,"history":{"2019":"Austrians","2020":"Spring Wheat","2021":"Mustard"}},
  "west Hauser Rd.|2 (west 1)":{"common":"west Hauser Rd.","farm":"underdal ent.(missile)","fieldNum":"2 (west 1)","acres":158.66,"history":{"2022":"CC WW","2023":"Austrians","2024":"Spring Wheat","2025":"Lentils","2026":"Spring Wheat"}},
  "west buildings state|1":{"common":"west buildings state","farm":"state","fieldNum":"1","acres":34.43,"history":{"2019":"Spring Wheat","2020":"Chickpeas","2021":"Spring Wheat"}},
  "west buildings state|1 (west 4)":{"common":"west buildings state","farm":"state","fieldNum":"1 (west 4)","acres":34.43,"history":{"2022":"Green Peas","2023":"CC WW","2024":"Chickpeas","2025":"CC HAD","2026":"Green Peas"}},
  "west buildings state|2":{"common":"west buildings state","farm":"state","fieldNum":"2","acres":36.55,"history":{"2019":"Austrians","2020":"Spring Wheat","2021":"Chickpeas"}},
  "west buildings state|2 (west 3)":{"common":"west buildings state","farm":"state","fieldNum":"2 (west 3)","acres":36.55,"history":{"2022":"Spring Wheat","2023":"Austrians","2024":"CC WW","2025":"Lentils","2026":"Spring Wheat"}},
  "west buildings state|3":{"common":"west buildings state","farm":"state","fieldNum":"3","acres":59.69,"history":{"2019":"Spring Wheat","2020":"Chickpeas","2021":"Spring Wheat"}},
  "west buildings state|3 (west 2)":{"common":"west buildings state","farm":"state","fieldNum":"3 (west 2)","acres":59.69,"history":{"2022":"Green Peas","2023":"CC WW","2024":"Chickpeas","2025":"CC HAD","2026":"Green Peas"}},
  "west home reservoir|1":{"common":"west home reservoir","farm":"underdal ent. (home)","fieldNum":"1","acres":64.35,"history":{"2019":"Spring Wheat","2020":"Flax","2021":"Spring Wheat","2022":"Green Peas","2023":"CC WW","2024":"Chickpeas","2025":"CC WW","2026":"Green Peas"}},
  "west kirby house|1":{"common":"west kirby house","farm":"underdal ent.(missile)","fieldNum":"1","acres":156.11,"history":{"2019":"Spring Wheat","2020":"Austrians","2021":"Spring Wheat","2022":"Chickpeas","2023":"CC WW","2024":"Green Peas","2025":"CC HAD","2026":"Chickpeas"}},
  "west kirby house|2":{"common":"west kirby house","farm":"underdal ent.(missile)","fieldNum":"2","acres":145.4,"history":{"2019":"Spring Wheat","2020":"Austrians","2021":"Spring Wheat","2022":"Chickpeas","2023":"CC WW","2024":"Green Peas","2025":"CC HAD","2026":"Chickpeas"}},
  "west kirby|1":{"common":"west kirby","farm":"danrather (missile)","fieldNum":"1","acres":16.4,"history":{"2019":"Spring Wheat","2020":"Austrians","2021":"Spring Wheat","2022":"Chickpeas","2023":"CC WW","2024":"Green Peas","2025":"CC HAD","2026":"Chickpeas"}},
  "west kirby|2":{"common":"west kirby","farm":"danrather (missile)","fieldNum":"2","acres":59.29,"history":{"2019":"Spring Wheat","2020":"Austrians","2021":"Spring Wheat","2022":"Chickpeas","2023":"CC WW","2024":"Green Peas","2025":"CC HAD","2026":"Chickpeas"}},
  "winter wheat|1":{"common":"winter wheat","farm":"SHARAY","fieldNum":"1","acres":482.37,"history":{"2020":"CC WW"}},
};


const GLOBALLY_INELIGIBLE = new Set(["Corn","Hemp","Chem-Fallow","Soybeans","Cotton","Rice"]);
const ALL_CROPS = ["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Durum","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax","Corn","Hemp","Chem-Fallow","Soybeans"];
const EXP = [
  ["cropInsurance","Crop Insurance"],["gasFuelOil","Gas, Fuel & Oil"],["wages","Wages & In-Kind"],
  ["ira","IRA Employee"],["fertilizerChemical","Fertilizer & Chemical"],["equipmentLoans","Equipment Loans & Leases"],
  ["equipmentPurchases","Equipment Purchases"],["landLeases","Land Leases & Purchases"],["groceries","Groceries"],
  ["repairsMaintenance","Repairs & Maintenance"],["utilities","Utilities (Phone, Elec.)"],["propertyTax","Property Tax & Ins."],
  ["seed","Seed & Seed Cleaning"],["professionalFees","Professional Fees"],["misc","Misc (Travel, Meals, etc.)"],
  ["freightCustomHire","Freight & Custom Hire"],["medical","Medical"],["interestOperating","Interest on Operating"],
];
const DEFAULT_RATES = {
  cropInsurance:19.70,gasFuelOil:11.03,wages:16.03,ira:2.50,fertilizerChemical:42.00,equipmentLoans:20.40,
  equipmentPurchases:3.61,landLeases:34.42,groceries:2.06,repairsMaintenance:8.70,utilities:2.25,
  propertyTax:4.60,seed:7.45,professionalFees:2.98,misc:3.67,freightCustomHire:0.90,medical:0.69,interestOperating:2.29,
};
const CROP_EXP_DEFAULTS = {
  "Spring Wheat":{seed:8.50,fertilizerChemical:44.00,cropInsurance:22.00},
  "Winter Wheat":{seed:5.00,fertilizerChemical:38.00,cropInsurance:17.00},
  "CC WW":{seed:5.00,fertilizerChemical:38.00,cropInsurance:18.00},
  "CC HAD":{seed:5.50,fertilizerChemical:42.00,cropInsurance:22.00},
  "Barley":{seed:7.50,fertilizerChemical:40.00,cropInsurance:17.00},
  "Durum":{seed:8.50,fertilizerChemical:44.00,cropInsurance:22.00},
  "Lentils":{seed:14.00,fertilizerChemical:24.00,cropInsurance:16.00},
  "Chickpeas":{seed:20.00,fertilizerChemical:21.00,cropInsurance:20.00},
  "Austrians":{seed:12.00,fertilizerChemical:20.00,cropInsurance:15.00},
  "Green Peas":{seed:16.00,fertilizerChemical:22.00,cropInsurance:16.00},
  "Yellow Peas":{seed:16.00,fertilizerChemical:22.00,cropInsurance:16.00},
  "Mustard":{seed:4.50,fertilizerChemical:36.00,cropInsurance:18.00},
  "Canola":{seed:14.00,fertilizerChemical:50.00,cropInsurance:20.00},
  "Flax":{seed:9.00,fertilizerChemical:34.00,cropInsurance:16.00},
};
const ACTUALS_2023 = {
  cropInsurance:23.03,gasFuelOil:12.33,wages:16.48,ira:1.73,fertilizerChemical:42.91,equipmentLoans:16.82,
  equipmentPurchases:10.79,landLeases:29.44,groceries:2.36,repairsMaintenance:8.60,utilities:2.30,
  propertyTax:4.33,seed:5.44,professionalFees:3.06,misc:6.03,freightCustomHire:0.22,medical:0.43,interestOperating:0,
};
const BUDGET_2024 = {
  cropInsurance:19.70,gasFuelOil:11.72,wages:17.20,ira:2.70,fertilizerChemical:44.86,equipmentLoans:21.81,
  equipmentPurchases:3.92,landLeases:35.53,groceries:2.20,repairsMaintenance:9.31,utilities:2.45,
  propertyTax:4.90,seed:7.84,professionalFees:3.18,misc:3.92,freightCustomHire:0.98,medical:0.74,interestOperating:2.45,
};
const ACTUALS_2025 = {
  cropInsurance:19.65,gasFuelOil:11.0,wages:16.0,ira:2.5,fertilizerChemical:42.0,equipmentLoans:20.4,
  equipmentPurchases:3.6,landLeases:34.4,groceries:2.06,repairsMaintenance:8.7,utilities:2.25,
  propertyTax:4.6,seed:7.56,professionalFees:2.98,misc:3.66,freightCustomHire:0.9,medical:0.69,interestOperating:2.29,
};
const BUDGET_2026 = {
  cropInsurance:16.36,gasFuelOil:11.0,wages:16.0,ira:2.5,fertilizerChemical:41.0,equipmentLoans:17.26,
  equipmentPurchases:3.6,landLeases:31.8,groceries:2.06,repairsMaintenance:8.7,utilities:2.25,
  propertyTax:4.6,seed:7.56,professionalFees:2.98,misc:3.66,freightCustomHire:0.9,medical:0.69,interestOperating:2.29,
};
const YEAR_LABELS = {"2023 Actuals":ACTUALS_2023,"2024 Budget":BUDGET_2024,"2025 Actuals":ACTUALS_2025,"2026 Budget":BUDGET_2026};

// ── Typical Hi-Line MT guarantee & projection values (used for crop suggestions) ──
const CROP_TYPICAL = {
  "Spring Wheat":  { buGuar:24,  priceGuar:5.80, buProj:28,  projPrice:6.00 },
  "Winter Wheat":  { buGuar:35,  priceGuar:5.50, buProj:42,  projPrice:5.75 },
  "CC WW":         { buGuar:28,  priceGuar:5.80, buProj:32,  projPrice:6.00 },
  "CC HAD":        { buGuar:24,  priceGuar:6.75, buProj:28,  projPrice:7.00 },
  "Barley":        { buGuar:40,  priceGuar:4.50, buProj:48,  projPrice:5.50 },
  "Durum":         { buGuar:22,  priceGuar:7.00, buProj:26,  projPrice:7.50 },
  "Lentils":       { buGuar:16,  priceGuar:9.00, buProj:20,  projPrice:12.00 },
  "Chickpeas":     { buGuar:16,  priceGuar:13.80,buProj:20,  projPrice:14.00 },
  "Green Peas":    { buGuar:16,  priceGuar:9.00, buProj:22,  projPrice:10.00 },
  "Yellow Peas":   { buGuar:16,  priceGuar:9.00, buProj:22,  projPrice:10.00 },
  "Austrians":     { buGuar:17,  priceGuar:15.00,buProj:22,  projPrice:16.00 },
  "Mustard":       { buGuar:10,  priceGuar:20.00,buProj:13,  projPrice:22.00 },
  "Canola":        { buGuar:20,  priceGuar:12.00,buProj:26,  projPrice:14.00 },
  "Flax":          { buGuar:12,  priceGuar:18.00,buProj:16,  projPrice:20.00 },
};

const FIELD_APH = {
  "North Wanken|20-31N-5E":{"Yellow Peas":{"aph":17.1,"n":1},"CC HAD":{"aph":28.6,"n":1},"Lentils":{"aph":21.7,"n":1},"CC WW":{"aph":28.4,"n":2},"Chickpeas":{"aph":4.0,"n":2},"Barley":{"aph":1.0,"n":1},"Austrians":{"aph":9.2,"n":1},"Mustard":{"aph":6.9,"n":1}},
  "West 120's|36-31N-4E":{"Winter Wheat":{"aph":56.1,"n":3},"CC WW":{"aph":17.6,"n":2},"Yellow Peas":{"aph":29.1,"n":1},"Chickpeas":{"aph":9.0,"n":1},"Spring Wheat":{"aph":15.5,"n":1},"Lentils":{"aph":3.1,"n":1},"Mustard":{"aph":8.8,"n":1}},
  "South House|32-31N-5E":{"Winter Wheat":{"aph":56.6,"n":3},"Chickpeas":{"aph":14.1,"n":2},"Spring Wheat":{"aph":24.9,"n":2},"Lentils":{"aph":7.7,"n":1},"CC WW":{"aph":2.0,"n":1},"Flax":{"aph":1.3,"n":1},"Mustard":{"aph":4.5,"n":1}},
  "House|29-31N-5E":{"Green Peas":{"aph":5.9,"n":1},"CC HAD":{"aph":14.6,"n":2},"Winter Wheat":{"aph":49.3,"n":1},"CC WW":{"aph":32.8,"n":1},"Lentils":{"aph":6.1,"n":2},"Chickpeas":{"aph":4.9,"n":1},"Mustard":{"aph":8.2,"n":1}},
  "North Henke|05-30N-7E":{"Winter Wheat":{"aph":28.7,"n":2},"CC WW":{"aph":16.8,"n":2},"Chickpeas":{"aph":8.8,"n":2},"Mustard":{"aph":1.3,"n":1},"Spring Wheat":{"aph":18.9,"n":2}},
  "North Kammer|02-31N-5E":{"Winter Wheat":{"aph":40.2,"n":2},"Chickpeas":{"aph":5.0,"n":2},"CC WW":{"aph":15.8,"n":2},"Yellow Peas":{"aph":13.8,"n":1},"Spring Wheat":{"aph":8.9,"n":1},"Lentils":{"aph":3.1,"n":1},"Mustard":{"aph":5.5,"n":1}},
  "Henke/Hill|04-30N-7E":{"CC WW":{"aph":10.2,"n":2},"Chickpeas":{"aph":2.6,"n":2},"Winter Wheat":{"aph":25.4,"n":1},"Austrians":{"aph":16.0,"n":1},"Lentils":{"aph":0.3,"n":1},"Mustard":{"aph":5.8,"n":1},"Spring Wheat":{"aph":9.7,"n":1}},
  "East Trues|08-30N-5E":{"Winter Wheat":{"aph":57.8,"n":2},"Chickpeas":{"aph":25.7,"n":2},"CC HAD":{"aph":21.9,"n":1},"Spring Wheat":{"aph":32.9,"n":1},"Green Peas":{"aph":30.4,"n":1},"CC WW":{"aph":19.8,"n":2},"Yellow Peas":{"aph":5.9,"n":1},"Mustard":{"aph":3.3,"n":1}},
  "North Cabin|17-30N-5E":{"Winter Wheat":{"aph":47.6,"n":1},"Chickpeas":{"aph":16.3,"n":3},"CC HAD":{"aph":30.8,"n":1},"Lentils":{"aph":26.6,"n":1},"CC WW":{"aph":19.4,"n":2},"Austrians":{"aph":12.2,"n":1},"Spring Wheat":{"aph":19.4,"n":1}},
  "Trues|07-30N-5E":{"CC HAD":{"aph":28.2,"n":2},"Winter Wheat":{"aph":50.0,"n":1},"CC WW":{"aph":30.2,"n":1},"Austrians":{"aph":16.9,"n":1},"Spring Wheat":{"aph":10.6,"n":2},"Chickpeas":{"aph":2.4,"n":1},"Canola":{"aph":0.7,"n":1},"Lentils":{"aph":4.3,"n":1}},
  "West Trues|18-30N-5E":{"CC HAD":{"aph":15.9,"n":4},"Chickpeas":{"aph":40.9,"n":2},"Austrians":{"aph":21.8,"n":1},"Flax":{"aph":2.0,"n":1},"Lentils":{"aph":18.7,"n":1}},
  "Pivot|19-30N-5E":{"IRR Green Pea":{"aph":39.9,"n":1},"CC HAD":{"aph":36.6,"n":1},"Chickpeas":{"aph":51.5,"n":1},"Austrians":{"aph":18.9,"n":2},"Flax":{"aph":42.9,"n":1},"Spring Wheat":{"aph":54.0,"n":1},"Hemp":{"aph":28.6,"n":1},"corn":{"aph":85.8,"n":2}},
  "Barn|21-30N-5E":{"CC HAD":{"aph":31.1,"n":2},"Chickpeas":{"aph":13.9,"n":2},"CC WW":{"aph":17.1,"n":2},"Green Peas":{"aph":25.8,"n":1},"Spring Wheat":{"aph":10.6,"n":1},"Austrians":{"aph":14.0,"n":1},"Mustard":{"aph":17.8,"n":1}},
  "Cabin East|20-30N-5E":{"Green Peas":{"aph":20.4,"n":1},"Austrians":{"aph":19.3,"n":3},"Chickpeas":{"aph":10.2,"n":2},"CC HAD":{"aph":25.0,"n":1},"CC WW":{"aph":26.3,"n":1},"Spring Wheat":{"aph":11.6,"n":1},"Mustard":{"aph":13.3,"n":1}},
  "STATE|21-30N-5E":{"CC HAD":{"aph":30.1,"n":3},"CC WW":{"aph":17.7,"n":2},"Green Peas":{"aph":25.8,"n":1},"Chickpeas":{"aph":6.0,"n":1},"Spring Wheat":{"aph":13.4,"n":1},"Austrians":{"aph":12.9,"n":1},"Mustard":{"aph":17.8,"n":1}},
  "South Rd.|07-30N-7E":{"CC HAD":{"aph":7.0,"n":1},"sunflowers":{"aph":26.1,"n":1},"Austrians":{"aph":2.3,"n":1},"CC WW":{"aph":4.0,"n":2},"Chickpeas":{"aph":5.7,"n":2},"Spring Wheat":{"aph":18.6,"n":1},"Mustard":{"aph":5.0,"n":1}},
  "North 320|23-31N-7E":{"CC HAD":{"aph":5.3,"n":1},"Chickpeas":{"aph":14.4,"n":2},"Winter Wheat":{"aph":31.0,"n":1},"Lentils":{"aph":7.6,"n":2},"CC WW":{"aph":13.6,"n":2},"Yellow Peas":{"aph":4.4,"n":1},"Mustard":{"aph":2.6,"n":1}},
  "West 320|27-31N-7E":{"CC HAD":{"aph":10.4,"n":2},"Lentils":{"aph":13.2,"n":2},"Chickpeas":{"aph":4.3,"n":2},"Austrians":{"aph":25.1,"n":1},"CC WW":{"aph":12.3,"n":2},"Yellow Peas":{"aph":4.4,"n":1},"Mustard":{"aph":4.4,"n":1}},
  "East 320|26-31N-7E":{"CC HAD":{"aph":5.6,"n":2},"Lentils":{"aph":13.5,"n":2},"Chickpeas":{"aph":7.5,"n":2},"Austrians":{"aph":24.0,"n":1},"CC WW":{"aph":13.2,"n":2},"Yellow Peas":{"aph":4.4,"n":1},"Mustard":{"aph":4.2,"n":1}},
  "North 320|24-30N-5E":{"CC WW":{"aph":31.6,"n":1},"Green Peas":{"aph":17.2,"n":1},"CC HAD":{"aph":10.6,"n":1},"oats":{"aph":40.7,"n":1}},
  "South 480|25-30N-5E":{"CC WW":{"aph":28.1,"n":1},"Lentils":{"aph":17.9,"n":1},"Chickpeas":{"aph":9.9,"n":1}},
  "South 480|26-30N-5E":{"CC WW":{"aph":25.4,"n":1},"Lentils":{"aph":18.2,"n":1},"Chickpeas":{"aph":5.8,"n":1},"Flax":{"aph":13.9,"n":1}},
  "Decker yard W|07-30N-6E":{"CC WW":{"aph":21.8,"n":2},"Winter Wheat":{"aph":44.3,"n":1},"Austrians":{"aph":13.0,"n":1},"Chickpeas":{"aph":8.3,"n":2},"Lentils":{"aph":3.1,"n":1},"Mustard":{"aph":2.8,"n":1}},
  "Decker yard E|08-30N-6E":{"CC WW":{"aph":19.5,"n":2},"Winter Wheat":{"aph":43.4,"n":1},"Austrians":{"aph":12.5,"n":1},"Chickpeas":{"aph":9.5,"n":2},"Lentils":{"aph":3.1,"n":1},"Mustard":{"aph":2.8,"n":1}},
  "Decker Yard|08-30N-6E":{"CC WW":{"aph":10.0,"n":2},"Winter Wheat":{"aph":42.3,"n":1},"Austrians":{"aph":12.7,"n":1},"Chickpeas":{"aph":11.2,"n":2},"Lentils":{"aph":2.5,"n":1},"Mustard":{"aph":2.9,"n":1}},
  "North 320|16-31N-5E":{"Winter Wheat":{"aph":66.4,"n":1}},
  "West 50s|31-31N-5E":{"Winter Wheat":{"aph":73.2,"n":1},"Yellow Peas":{"aph":21.1,"n":2},"CC WW":{"aph":20.3,"n":3},"Chickpeas":{"aph":9.9,"n":1},"Spring Wheat":{"aph":15.3,"n":1},"Mustard":{"aph":2.4,"n":1}},
  "South Poles|32-31N-5E":{"Chickpeas":{"aph":8.7,"n":2},"CC HAD":{"aph":12.8,"n":1},"Lentils":{"aph":6.3,"n":2},"Flax":{"aph":1.6,"n":1},"Mustard":{"aph":4.5,"n":1},"Spring Wheat":{"aph":18.9,"n":1}},
  "North Hendrickson|21-31N-5E":{"Winter Wheat":{"aph":52.1,"n":1},"Lentils":{"aph":10.0,"n":1},"Chickpeas":{"aph":18.1,"n":2},"Yellow Peas":{"aph":1.0,"n":1},"CC WW":{"aph":10.7,"n":1},"Mustard":{"aph":6.9,"n":1},"Austrians":{"aph":20.4,"n":1}},
  "Joplin Rd|03-30N-7E":{"Winter Wheat":{"aph":31.5,"n":1},"CC HAD":{"aph":11.7,"n":1},"Mustard":{"aph":7.2,"n":2},"CC WW":{"aph":6.0,"n":1}},
  "Joplin Rd|02-30N-7E":{"Winter Wheat":{"aph":31.5,"n":1},"CC HAD":{"aph":9.1,"n":1},"Mustard":{"aph":7.4,"n":2},"CC WW":{"aph":6.0,"n":1}},
  "Joplin Rd|11-30N-7E":{"Winter Wheat":{"aph":32.9,"n":1},"CC HAD":{"aph":8.3,"n":1},"Mustard":{"aph":8.0,"n":2},"CC WW":{"aph":6.0,"n":1}},
  "Blow Field|06-30N-5E":{"Winter Wheat":{"aph":70.7,"n":1},"Chickpeas":{"aph":6.1,"n":3},"CC HAD":{"aph":25.7,"n":1},"CC WW":{"aph":25.6,"n":1},"Lentils":{"aph":8.8,"n":2},"Spring Wheat":{"aph":1.8,"n":1},"Mustard":{"aph":5.0,"n":1}},
  "West CRP|12-30N-4E":{"Austrians":{"aph":16.0,"n":1},"Winter Wheat":{"aph":51.6,"n":1},"Chickpeas":{"aph":10.5,"n":2},"CC WW":{"aph":16.7,"n":2},"Yellow Peas":{"aph":1.0,"n":1},"Mustard":{"aph":3.6,"n":1},"Lentils":{"aph":10.1,"n":1}},
  "Pivot CRP|19-30N-5E":{"Austrians":{"aph":12.2,"n":3},"Flax":{"aph":16.1,"n":1},"Spring Wheat":{"aph":9.0,"n":1},"Yellow Peas":{"aph":1.4,"n":1},"corn":{"aph":14.1,"n":1}},
  "island|20-30N-5E":{"Austrians":{"aph":16.4,"n":3},"CC HAD":{"aph":25.8,"n":1},"CC WW":{"aph":35.6,"n":1},"Spring Wheat":{"aph":11.6,"n":1},"Mustard":{"aph":2.2,"n":1},"Chickpeas":{"aph":11.3,"n":1}},
  "BOR|20-30N-5E":{"Winter Wheat":{"aph":45.4,"n":1},"CC HAD":{"aph":24.5,"n":1},"Austrians":{"aph":17.8,"n":2},"CC WW":{"aph":36.8,"n":1},"Spring Wheat":{"aph":11.6,"n":1},"Mustard":{"aph":1.8,"n":1},"Chickpeas":{"aph":11.3,"n":1}},
  "STATE|06-30N-7E":{"Winter Wheat":{"aph":34.1,"n":1},"CC HAD":{"aph":27.1,"n":1},"CC WW":{"aph":13.4,"n":2},"Chickpeas":{"aph":8.9,"n":2},"Mustard":{"aph":1.3,"n":1},"Spring Wheat":{"aph":16.9,"n":1}},
  "STATE|07-30N-7E":{"Winter Wheat":{"aph":27.4,"n":1},"sunflowers":{"aph":16.4,"n":1},"Austrians":{"aph":6.8,"n":1},"CC WW":{"aph":21.7,"n":1},"Chickpeas":{"aph":5.8,"n":2},"Lentils":{"aph":0.8,"n":1},"Spring Wheat":{"aph":15.0,"n":2}},
  "North Rd|06-30N-7E":{"Winter Wheat":{"aph":32.9,"n":1},"Austrians":{"aph":17.7,"n":1},"CC WW":{"aph":17.4,"n":2},"Chickpeas":{"aph":9.3,"n":2},"Mustard":{"aph":1.3,"n":1},"Spring Wheat":{"aph":19.2,"n":2}},
  "N. 320|24-31N-6":{"Winter Wheat":{"aph":47.6,"n":1},"Chickpeas":{"aph":15.9,"n":2},"Green Peas":{"aph":34.2,"n":1},"CC WW":{"aph":4.0,"n":1},"Lentils":{"aph":1.2,"n":1},"Mustard":{"aph":1.0,"n":1},"CC HAD":{"aph":20.2,"n":1}},
  "East Section|25-31N-6":{"Winter Wheat":{"aph":43.8,"n":1},"Austrians":{"aph":9.0,"n":1},"Chickpeas":{"aph":12.6,"n":1},"CC WW":{"aph":5.0,"n":1},"Lentils":{"aph":0.0,"n":1},"Spring Wheat":{"aph":10.8,"n":1},"Mustard":{"aph":4.2,"n":1}},
  "House|26-31N-6E":{"Lentils":{"aph":2.4,"n":1},"Winter Wheat":{"aph":38.3,"n":1},"Chickpeas":{"aph":9.8,"n":2},"CC WW":{"aph":25.7,"n":1},"Spring Wheat":{"aph":8.3,"n":2},"Austrians":{"aph":17.2,"n":1}},
  "West Section|27-31N-6E":{"Winter Wheat":{"aph":29.8,"n":2},"Lentils":{"aph":10.5,"n":1},"CC WW":{"aph":21.2,"n":1},"Chickpeas":{"aph":5.7,"n":2},"Spring Wheat":{"aph":4.2,"n":1},"Austrians":{"aph":10.2,"n":1},"Mustard":{"aph":3.6,"n":1}},
  "North Tiber Grade|16-31N-5E":{"Lentils":{"aph":7.2,"n":2},"Chickpeas":{"aph":13.1,"n":2},"CC WW":{"aph":21.3,"n":1},"Yellow Peas":{"aph":0.3,"n":1},"Barley":{"aph":5.0,"n":1},"Spring Wheat":{"aph":22.1,"n":1},"CC HAD":{"aph":20.7,"n":1}},
  "Northwest 640|32-32N-7E":{"Mustard":{"aph":9.0,"n":1},"CC WW":{"aph":23.3,"n":1},"Chickpeas":{"aph":1.0,"n":1}},
  "Southwest 640|05-31N-7E":{"Flax":{"aph":6.6,"n":1},"CC WW":{"aph":25.4,"n":1},"Chickpeas":{"aph":2.5,"n":1}},
  "North Building site|33-30N-3E":{"Austrians":{"aph":11.7,"n":2},"Spring Wheat":{"aph":28.0,"n":2},"Mustard":{"aph":2.0,"n":1},"Lentils":{"aph":6.2,"n":1}},
  "West building site|33-30N-3E":{"Spring Wheat":{"aph":35.8,"n":2},"Chickpeas":{"aph":16.2,"n":2},"Green Peas":{"aph":2.8,"n":1},"CC WW":{"aph":17.6,"n":1},"CC HAD":{"aph":15.4,"n":1}},
  "Rock Hilltop|32-30N-3E":{"Spring Wheat":{"aph":33.9,"n":2},"Austrians":{"aph":33.6,"n":1},"Chickpeas":{"aph":16.1,"n":1},"CC WW":{"aph":28.4,"n":2},"Green Peas":{"aph":10.7,"n":1}},
  "west kirby house|3-29N-3E":{"Spring Wheat":{"aph":36.5,"n":2},"Austrians":{"aph":14.8,"n":1},"Chickpeas":{"aph":6.9,"n":1},"CC WW":{"aph":29.7,"n":1},"Green Peas":{"aph":7.5,"n":1},"CC HAD":{"aph":19.6,"n":1}},
  "west Hauser Rd.|3-29N-3E":{"Spring Wheat":{"aph":33.4,"n":2},"Chickpeas":{"aph":14.4,"n":2},"Green Peas":{"aph":7.7,"n":1},"CC WW":{"aph":58.4,"n":1},"CC HAD":{"aph":22.8,"n":1}},
  "South Rock Hilltop|5-29N-3E":{"Spring Wheat":{"aph":35.2,"n":2},"Austrians":{"aph":33.8,"n":1},"Chickpeas":{"aph":15.6,"n":1},"CC WW":{"aph":21.5,"n":2},"Green Peas":{"aph":10.1,"n":1}},
  "far west north place|5-29N-3E":{"Spring Wheat":{"aph":38.0,"n":2},"Austrians":{"aph":38.8,"n":1},"Chickpeas":{"aph":3.2,"n":1},"CC WW":{"aph":18.0,"n":2},"Green Peas":{"aph":10.3,"n":1}},
  "Old House West|8-29N-3E":{"Spring Wheat":{"aph":28.0,"n":2},"Austrians":{"aph":26.5,"n":1},"Chickpeas":{"aph":13.7,"n":1},"CC WW":{"aph":21.7,"n":2},"Green Peas":{"aph":5.5,"n":1}},
  "South Kirby corner|10-29N-3E":{"Spring Wheat":{"aph":33.3,"n":2},"Austrians":{"aph":34.2,"n":1},"Chickpeas":{"aph":9.7,"n":1},"CC WW":{"aph":17.7,"n":2},"Green Peas":{"aph":5.9,"n":1}},
  "west home reservoir|11-29N-3E":{"Spring Wheat":{"aph":34.9,"n":2},"Flax":{"aph":15.5,"n":1},"Green Peas":{"aph":2.3,"n":1},"CC WW":{"aph":14.4,"n":2},"Chickpeas":{"aph":7.3,"n":1}},
  "N1/2 St. Olaf|23-29N-3E":{"Spring Wheat":{"aph":36.8,"n":2},"Austrians":{"aph":9.6,"n":1},"Chickpeas":{"aph":4.6,"n":1},"CC WW":{"aph":12.2,"n":1},"Green Peas":{"aph":11.9,"n":1},"CC HAD":{"aph":19.3,"n":1}},
  "S1/2 St. Olaf|23-29N-3E":{"Spring Wheat":{"aph":36.5,"n":2},"Austrians":{"aph":9.5,"n":1},"Chickpeas":{"aph":11.2,"n":1},"CC WW":{"aph":12.7,"n":1},"Green Peas":{"aph":7.8,"n":1},"CC HAD":{"aph":19.3,"n":1}},
  "Shotgun Slough|29-29N-3E":{"Chickpeas":{"aph":2.2,"n":1},"Spring Wheat":{"aph":37.6,"n":1},"Green Peas":{"aph":4.9,"n":1},"CC WW":{"aph":1.9,"n":1},"Lentils":{"aph":5.0,"n":1},"Mustard":{"aph":1.3,"n":1}},
  "West 200|31-29N-3E":{"Spring Wheat":{"aph":36.5,"n":2},"Chickpeas":{"aph":21.1,"n":1},"Austrians":{"aph":2.0,"n":1},"CC WW":{"aph":28.0,"n":2},"Lentils":{"aph":10.5,"n":1}},
  "South Shotgun|32-29N-3E":{"Spring Wheat":{"aph":42.0,"n":2},"Chickpeas":{"aph":21.0,"n":1},"Austrians":{"aph":3.1,"n":1},"CC WW":{"aph":12.6,"n":2},"Lentils":{"aph":7.2,"n":1}},
  "Lynch 40|32-29N-3E":{"Chickpeas":{"aph":11.6,"n":2},"Spring Wheat":{"aph":31.9,"n":1},"Green Peas":{"aph":4.9,"n":1},"CC WW":{"aph":19.0,"n":2},"Mustard":{"aph":7.1,"n":1}},
  "East 320|33-29N-3E":{"Chickpeas":{"aph":19.1,"n":2},"Spring Wheat":{"aph":32.6,"n":1},"Green Peas":{"aph":4.9,"n":1},"CC WW":{"aph":16.7,"n":2},"Mustard":{"aph":8.4,"n":1}},
  "Home Place|12-29N-3E":{"Spring Wheat":{"aph":33.7,"n":2},"Flax":{"aph":15.3,"n":1},"Chickpeas":{"aph":4.8,"n":1},"CC WW":{"aph":14.6,"n":1},"Green Peas":{"aph":8.0,"n":1},"Barley":{"aph":17.8,"n":1}},
  "South House Section|14-29N-3E":{"Spring Wheat":{"aph":38.2,"n":2},"Chickpeas":{"aph":20.8,"n":2},"Austrians":{"aph":0.1,"n":1},"CC WW":{"aph":28.9,"n":1},"CC HAD":{"aph":25.1,"n":1}},
  "North Kirby|3-29N-3E":{"Spring Wheat":{"aph":25.3,"n":2},"Austrians":{"aph":14.8,"n":1},"Chickpeas":{"aph":8.4,"n":1},"CC WW":{"aph":16.1,"n":1},"Green Peas":{"aph":7.1,"n":1},"CC HAD":{"aph":19.6,"n":1}},
  "west kirby|3-29N-3E":{"Spring Wheat":{"aph":25.3,"n":2},"Austrians":{"aph":14.8,"n":1},"Chickpeas":{"aph":7.4,"n":1},"CC WW":{"aph":16.1,"n":1},"Green Peas":{"aph":7.6,"n":1},"CC HAD":{"aph":19.6,"n":1}},
  "west buildings state|33-30N-3E":{"Spring Wheat":{"aph":28.7,"n":2},"Chickpeas":{"aph":13.5,"n":2},"Green Peas":{"aph":1.1,"n":1},"CC WW":{"aph":32.6,"n":1},"CC HAD":{"aph":15.4,"n":1}},
  "south state 320|4-29N-3E":{"Spring Wheat":{"aph":36.9,"n":2},"Chickpeas":{"aph":16.1,"n":2},"Green Peas":{"aph":4.5,"n":1},"CC WW":{"aph":37.7,"n":1},"CC HAD":{"aph":15.4,"n":1}},
  "south state 321|4-29N-3E":{"Austrians":{"aph":6.0,"n":1},"Spring Wheat":{"aph":40.4,"n":1}},
  "north rock hill|32-30N-3E":{"Spring Wheat":{"aph":24.3,"n":2},"Austrians":{"aph":33.8,"n":1},"Chickpeas":{"aph":13.6,"n":1},"CC WW":{"aph":27.4,"n":2},"Green Peas":{"aph":9.1,"n":1}},
  "winter wheat|":{"CC WW":{"aph":28.2,"n":1}},
  "SW 320|25-31N-7E":{"Winter Wheat":{"aph":23.0,"n":1},"Yellow Peas":{"aph":5.0,"n":1},"Spring Wheat":{"aph":29.8,"n":1}},
  "NW 320|24-31N-7E":{"Winter Wheat":{"aph":23.0,"n":1},"Yellow Peas":{"aph":5.6,"n":1},"Chickpeas":{"aph":13.0,"n":1}},
  "NE 320|24-31N-7E":{"Winter Wheat":{"aph":23.0,"n":1},"Yellow Peas":{"aph":5.5,"n":1},"Chickpeas":{"aph":12.7,"n":1}},
  "SE 320|25-31N-7E":{"Winter Wheat":{"aph":23.0,"n":1},"Yellow Peas":{"aph":4.6,"n":1},"Spring Wheat":{"aph":29.8,"n":1}},
  "West Joplin Road|35-31N-7E":{"Winter Wheat":{"aph":16.0,"n":1},"CC WW":{"aph":1.8,"n":1},"Chickpeas":{"aph":14.1,"n":1},"Spring Wheat":{"aph":15.7,"n":1},"Mustard":{"aph":5.8,"n":1}},
  "Beulow Rd|18-31N-7E":{"Chickpeas":{"aph":4.7,"n":2},"Spring Wheat":{"aph":7.8,"n":2},"Lentils":{"aph":4.3,"n":1}},
  "Beulow Rd|17-31N-7E":{"Chickpeas":{"aph":4.7,"n":2},"Spring Wheat":{"aph":7.5,"n":2},"Lentils":{"aph":6.5,"n":1}},
  "East 320|25-31N-5E":{"Spring Wheat":{"aph":30.3,"n":1},"Austrians":{"aph":16.3,"n":1}},
  "North 320|23-31N-5E":{"Mustard":{"aph":8.4,"n":1},"Lentils":{"aph":4.4,"n":1}},
  "Middle section|26-31N-5E":{"Spring Wheat":{"aph":32.3,"n":1},"Lentils":{"aph":6.0,"n":1}},
  "West 280|27-31N-5E":{"Spring Wheat":{"aph":0.2,"n":1},"Chickpeas":{"aph":6.2,"n":1}},
  "Watson West|12/13-29N-3E":{"Winter Wheat":{"aph":40.5,"n":1},"Chickpeas":{"aph":7.1,"n":1}},
  "Watson NorthWest|12-29N-3E":{"Winter Wheat":{"aph":53.2,"n":1},"Chickpeas":{"aph":13.0,"n":1}},
  "Watson North|7-29N-4E":{"Chickpeas":{"aph":8.9,"n":1},"CC HAD":{"aph":18.8,"n":1}},
  "Watson South|18-29N-4E":{"Chickpeas":{"aph":9.1,"n":1},"CC HAD":{"aph":13.8,"n":1}},
  "Watson SouthEast|17-29N-4E":{"Chickpeas":{"aph":10.1,"n":1},"CC HAD":{"aph":20.0,"n":1}},
  "Cedric Section 6|6-29N-4E":{"Winter Wheat":{"aph":40.4,"n":1},"Chickpeas":{"aph":7.2,"n":1}},
  "STATE north|06-30N-7E":{"Spring Wheat":{"aph":16.1,"n":1}},
  "Akey yard W|07-30N-6E":{"CC WW":{"aph":21.0,"n":1}},
  "Akey yard E|08-30N-6E":{"CC WW":{"aph":21.0,"n":1}},
  "Akey Yard|08-30N-6E":{"CC WW":{"aph":21.0,"n":1}},
  "East 320|":{"Spring Wheat":{"aph":20.3,"n":1}},
  "North 320|":{"Chickpeas":{"aph":8.1,"n":1}},
  "Middle section|":{"Chickpeas":{"aph":5.2,"n":1}},
  "West 280|":{"Spring Wheat":{"aph":27.6,"n":1}},
};

const CROP_SOLD_PRICES = {
  "Austrians":13.4,
  "CC HAD":6.56,
  "CC WW":4.9,
  "Chickpeas":20.0,
  "Flax":9.58,
  "Green Peas":8.67,
  "IRR Green Pea":8.0,
  "Lentils":27.33,
  "Mustard":28.0,
  "Spring Wheat":5.79,
  "Winter Wheat":5.23,
  "Yellow Peas":7.75,
  "corn":4.8,
  "oats":2.0,
  "sunflowers":4.2,
};

const WORKBOOK_PRODUCTION = {
  "North Wanken|20-31N-5E":{"2015":{"crop":"Yellow Peas","revenue":46189.0,"total_bu":5434.0,"sold_price":8.5,"bu_per_ac":17.09},"2016":{"crop":"CC HAD","revenue":48394.28,"total_bu":9096.7,"sold_price":5.32,"bu_per_ac":28.61},"2018":{"crop":"Lentils","revenue":62100.0,"total_bu":6900.0,"sold_price":9.0,"bu_per_ac":21.7},"2019":{"crop":"CC WW","revenue":71444.52,"total_bu":11907.4,"sold_price":6.0,"bu_per_ac":37.45},"2020":{"crop":"Chickpeas","revenue":1704.37,"total_bu":213.0,"sold_price":8.0,"bu_per_ac":0.67},"2021":{"crop":"Barley","total_bu":318.0,"bu_per_ac":1.0},"2022":{"crop":"Austrians","total_bu":2942.2,"bu_per_ac":9.25},"2023":{"crop":"Mustard","total_bu":2190.0,"bu_per_ac":6.89},"2024":{"crop":"CC WW","revenue":33676.1,"total_bu":6179.1,"sold_price":5.45,"bu_per_ac":19.43},"2025":{"crop":"Chickpeas","total_bu":2326.6,"bu_per_ac":7.32}},
  "West 120's|36-31N-4E":{"2015":{"crop":"Winter Wheat","revenue":120294.9,"total_bu":13827.0,"sold_price":8.7,"bu_per_ac":113.1},"2016":{"crop":"Winter Wheat","revenue":29170.68,"total_bu":7292.7,"sold_price":4.0,"bu_per_ac":59.35},"2017":{"crop":"Winter Wheat","revenue":86901.3,"total_bu":19311.4,"sold_price":4.5,"bu_per_ac":157.95},"2019":{"crop":"CC WW","revenue":33536.0,"total_bu":8384.0,"sold_price":4.0,"bu_per_ac":68.23},"2020":{"crop":"Yellow Peas","revenue":221151.0,"total_bu":14743.4,"sold_price":15.0,"bu_per_ac":119.99},"2021":{"crop":"CC WW","total_bu":2394.4,"bu_per_ac":19.49},"2022":{"crop":"Chickpeas","total_bu":3247.0,"bu_per_ac":26.43},"2023":{"crop":"Spring Wheat","total_bu":6207.5,"bu_per_ac":50.52},"2024":{"crop":"Lentils","revenue":40521.6,"total_bu":1500.8,"sold_price":27.0,"bu_per_ac":12.21},"2025":{"crop":"Mustard","total_bu":4209.3,"bu_per_ac":34.26}},
  "South House|32-31N-5E":{"2015":{"crop":"Winter Wheat","revenue":106337.08,"total_bu":15300.3,"sold_price":6.95,"bu_per_ac":97.69},"2016":{"crop":"Winter Wheat","revenue":54468.0,"total_bu":13617.0,"sold_price":4.0,"bu_per_ac":66.26},"2017":{"crop":"Winter Wheat","revenue":90000.0,"total_bu":20000.0,"sold_price":4.5,"bu_per_ac":85.49},"2018":{"crop":"Chickpeas","revenue":109800.0,"total_bu":9150.0,"sold_price":12.0,"bu_per_ac":39.11},"2019":{"crop":"Spring Wheat","revenue":63959.5,"total_bu":11629.0,"sold_price":5.5,"bu_per_ac":49.71},"2020":{"crop":"Lentils","revenue":121417.5,"total_bu":8094.5,"sold_price":15.0,"bu_per_ac":34.6},"2021":{"crop":"CC WW","total_bu":545.2,"bu_per_ac":2.33},"2022":{"crop":"Flax","total_bu":730.0,"bu_per_ac":3.12},"2023":{"crop":"Chickpeas","total_bu":6663.1,"bu_per_ac":28.48},"2024":{"crop":"Mustard","revenue":59908.8,"total_bu":2139.6,"sold_price":28.0,"bu_per_ac":9.15},"2025":{"crop":"Spring Wheat","total_bu":9012.9,"bu_per_ac":38.52}},
  "House|29-31N-5E":{"2015":{"crop":"Green Peas","revenue":43720.11,"total_bu":5025.3,"sold_price":8.7,"bu_per_ac":58.23},"2016":{"crop":"CC HAD","revenue":61626.8,"total_bu":15406.7,"sold_price":4.0,"bu_per_ac":99.23},"2017":{"crop":"Winter Wheat","revenue":80272.0,"total_bu":20068.0,"sold_price":4.0,"bu_per_ac":232.54},"2019":{"crop":"CC WW","revenue":56854.4,"total_bu":14213.6,"sold_price":4.0,"bu_per_ac":118.45},"2020":{"crop":"Lentils","revenue":5683.5,"total_bu":378.9,"sold_price":15.0,"bu_per_ac":3.16},"2022":{"crop":"Chickpeas","total_bu":4686.1,"bu_per_ac":39.05},"2023":{"crop":"Mustard","total_bu":4978.0,"bu_per_ac":41.48},"2024":{"crop":"CC HAD","revenue":46640.43,"total_bu":6982.1,"sold_price":6.68,"bu_per_ac":58.18},"2025":{"crop":"Lentils","total_bu":10087.5,"bu_per_ac":84.06}},
  "North Henke|05-30N-7E":{"2015":{"crop":"Winter Wheat","revenue":40000.0,"total_bu":8000.0,"sold_price":5.0,"bu_per_ac":23.7},"2017":{"crop":"Winter Wheat","revenue":51095.7,"total_bu":11354.6,"sold_price":4.5,"bu_per_ac":33.63},"2019":{"crop":"CC WW","revenue":39393.96,"total_bu":9848.5,"sold_price":4.0,"bu_per_ac":30.53},"2020":{"crop":"Chickpeas","revenue":42063.6,"total_bu":3505.3,"sold_price":12.0,"bu_per_ac":10.87},"2021":{"crop":"CC WW","total_bu":967.7,"bu_per_ac":3.0},"2022":{"crop":"Mustard","total_bu":430.7,"bu_per_ac":28.64},"2023":{"crop":"Spring Wheat","total_bu":7705.8,"bu_per_ac":512.35},"2024":{"crop":"Chickpeas","revenue":45406.0,"total_bu":2270.3,"sold_price":20.0,"bu_per_ac":150.95},"2025":{"crop":"Spring Wheat","total_bu":5020.0,"bu_per_ac":333.78}},
  "North Kammer|02-31N-5E":{"2015":{"crop":"Winter Wheat","revenue":57762.7,"total_bu":11552.5,"sold_price":5.0,"bu_per_ac":36.32},"2017":{"crop":"Winter Wheat","revenue":63000.0,"total_bu":14000.0,"sold_price":4.5,"bu_per_ac":44.01},"2018":{"crop":"Chickpeas","revenue":28200.0,"total_bu":2350.0,"sold_price":12.0,"bu_per_ac":7.39},"2019":{"crop":"CC WW","revenue":36332.0,"total_bu":9083.0,"sold_price":4.0,"bu_per_ac":28.55},"2020":{"crop":"Yellow Peas","revenue":30812.6,"total_bu":4401.8,"sold_price":7.0,"bu_per_ac":13.84},"2021":{"crop":"CC WW","total_bu":954.3,"bu_per_ac":3.0},"2022":{"crop":"Chickpeas","total_bu":806.7,"bu_per_ac":2.54},"2023":{"crop":"Spring Wheat","total_bu":2840.8,"bu_per_ac":8.93},"2024":{"crop":"Lentils","revenue":27062.91,"total_bu":1002.3,"sold_price":27.0,"bu_per_ac":3.15},"2025":{"crop":"Mustard","total_bu":1759.1,"bu_per_ac":5.53}},
  "Henke/Hill|04-30N-7E":{"2015":{"crop":"CC WW","revenue":10573.26,"total_bu":2114.7,"sold_price":5.0,"bu_per_ac":19.42},"2017":{"crop":"Chickpeas","revenue":9291.5,"total_bu":371.7,"sold_price":25.0,"bu_per_ac":3.08},"2019":{"crop":"Winter Wheat","revenue":10749.4,"total_bu":2687.3,"sold_price":4.0,"bu_per_ac":25.44},"2020":{"crop":"Austrians","revenue":15420.8,"total_bu":1927.6,"sold_price":8.0,"bu_per_ac":127.82},"2021":{"crop":"CC WW","total_bu":120.7,"bu_per_ac":8.0},"2022":{"crop":"Lentils","total_bu":32.0,"bu_per_ac":2.12},"2023":{"crop":"Mustard","total_bu":705.5,"bu_per_ac":46.78},"2024":{"crop":"Chickpeas","revenue":5238.0,"total_bu":261.9,"sold_price":20.0,"bu_per_ac":17.37},"2025":{"crop":"Spring Wheat","total_bu":1173.0,"bu_per_ac":77.79}},
  "East Trues|08-30N-5E":{"2015":{"crop":"Winter Wheat","revenue":216100.5,"total_bu":14406.7,"sold_price":15.0,"bu_per_ac":90.26},"2016":{"crop":"Chickpeas","revenue":24956.4,"total_bu":6239.1,"sold_price":4.0,"bu_per_ac":39.09},"2017":{"crop":"Winter Wheat","revenue":630000.0,"total_bu":21000.0,"sold_price":30.0,"bu_per_ac":131.56},"2018":{"crop":"CC HAD","revenue":17500.0,"total_bu":3500.0,"sold_price":5.0,"bu_per_ac":21.93},"2019":{"crop":"Spring Wheat","revenue":187918.5,"total_bu":12527.9,"sold_price":15.0,"bu_per_ac":78.49},"2020":{"crop":"Green Peas","revenue":58127.4,"total_bu":12917.2,"sold_price":4.5,"bu_per_ac":80.92},"2021":{"crop":"CC WW","total_bu":2441.3,"bu_per_ac":15.29},"2022":{"crop":"Yellow Peas","total_bu":1813.2,"bu_per_ac":11.36},"2023":{"crop":"Chickpeas","revenue":83428.2,"total_bu":4634.9,"sold_price":18.0,"bu_per_ac":29.04},"2024":{"crop":"Mustard","revenue":44875.6,"total_bu":1602.7,"sold_price":28.0,"bu_per_ac":10.04},"2025":{"crop":"CC WW","total_bu":14688.0,"bu_per_ac":92.02}},
  "North Cabin|17-30N-5E":{"2015":{"crop":"Winter Wheat","revenue":82500.0,"total_bu":15000.0,"sold_price":5.5,"bu_per_ac":47.58},"2017":{"crop":"Chickpeas","revenue":255000.0,"total_bu":8500.0,"sold_price":30.0,"bu_per_ac":26.96},"2018":{"crop":"CC HAD","revenue":48500.0,"total_bu":9700.0,"sold_price":5.0,"bu_per_ac":30.77},"2019":{"crop":"Lentils","revenue":75573.0,"total_bu":8397.0,"sold_price":9.0,"bu_per_ac":26.64},"2020":{"crop":"CC WW","revenue":44520.78,"total_bu":9893.5,"sold_price":4.5,"bu_per_ac":31.38},"2021":{"crop":"Chickpeas","total_bu":2143.7,"bu_per_ac":6.8},"2022":{"crop":"CC WW","total_bu":2364.0,"bu_per_ac":7.5},"2023":{"crop":"Austrians","total_bu":3829.2,"bu_per_ac":12.15},"2024":{"crop":"Spring Wheat","revenue":35336.95,"total_bu":6103.1,"sold_price":5.79,"bu_per_ac":19.36},"2025":{"crop":"Chickpeas","total_bu":4770.0,"bu_per_ac":15.13}},
  "Trues|07-30N-5E":{"2015":{"crop":"CC HAD","revenue":38862.9,"total_bu":4467.0,"sold_price":8.7,"bu_per_ac":38.15},"2016":{"crop":"Winter Wheat","revenue":61495.48,"total_bu":11559.3,"sold_price":5.32,"bu_per_ac":119.17},"2017":{"crop":"CC HAD","revenue":42750.0,"total_bu":9500.0,"sold_price":4.5,"bu_per_ac":81.13},"2019":{"crop":"CC WW","revenue":14153.0,"total_bu":3538.2,"sold_price":4.0,"bu_per_ac":30.22},"2020":{"crop":"Austrians","revenue":37067.2,"total_bu":4633.4,"sold_price":8.0,"bu_per_ac":39.57},"2021":{"crop":"Spring Wheat","total_bu":2047.7,"bu_per_ac":17.49},"2022":{"crop":"Chickpeas","total_bu":829.4,"bu_per_ac":7.08},"2023":{"crop":"Spring Wheat","total_bu":2052.5,"bu_per_ac":17.53},"2024":{"crop":"Canola","revenue":31800.81,"total_bu":4760.6,"sold_price":6.68,"bu_per_ac":40.65},"2025":{"crop":"Lentils","total_bu":2028.1,"bu_per_ac":17.32}},
  "West Trues|18-30N-5E":{"2015":{"crop":"CC HAD","revenue":11301.3,"total_bu":1299.0,"sold_price":8.7,"bu_per_ac":33.81},"2016":{"crop":"Chickpeas","revenue":18960.0,"total_bu":1185.0,"sold_price":16.0,"bu_per_ac":26.77},"2017":{"crop":"CC HAD","revenue":10380.8,"total_bu":2595.2,"sold_price":4.0,"bu_per_ac":67.55},"2020":{"crop":"Austrians","revenue":13883.2,"total_bu":1735.4,"sold_price":8.0,"bu_per_ac":45.17},"2021":{"crop":"Flax","total_bu":165.3,"bu_per_ac":4.3},"2022":{"crop":"CC HAD","total_bu":117.5,"bu_per_ac":3.06},"2023":{"crop":"Chickpeas","total_bu":4880.0,"bu_per_ac":127.02},"2024":{"crop":"CC HAD","revenue":8480.93,"total_bu":1269.6,"sold_price":6.68,"bu_per_ac":33.05},"2025":{"crop":"Lentils","total_bu":1545.4,"bu_per_ac":40.22}},
  "Pivot|19-30N-5E":{"2015":{"crop":"IRR Green Pea","revenue":22301.28,"total_bu":2787.7,"sold_price":8.0,"bu_per_ac":39.85},"2016":{"crop":"CC HAD","revenue":13642.24,"total_bu":2564.3,"sold_price":5.32,"bu_per_ac":36.65},"2017":{"crop":"Chickpeas","revenue":108030.0,"total_bu":3601.0,"sold_price":30.0,"bu_per_ac":51.47},"2019":{"crop":"Austrians","revenue":19800.0,"total_bu":2200.0,"sold_price":9.0,"bu_per_ac":31.45},"2020":{"crop":"Flax","revenue":30000.0,"total_bu":3000.0,"sold_price":10.0,"bu_per_ac":42.88},"2021":{"crop":"Spring Wheat","total_bu":3777.8,"bu_per_ac":54.0},"2022":{"crop":"Hemp","total_bu":2000.0,"bu_per_ac":28.59},"2023":{"crop":"corn","total_bu":8000.0,"bu_per_ac":114.35},"2024":{"crop":"corn","revenue":19200.0,"total_bu":4000.0,"sold_price":4.8,"bu_per_ac":57.18},"2025":{"crop":"Austrians","total_bu":442.0,"bu_per_ac":6.32}},
  "Barn|21-30N-5E":{"2015":{"crop":"CC HAD","revenue":43633.37,"total_bu":5015.3,"sold_price":8.7,"bu_per_ac":31.47},"2017":{"crop":"Chickpeas","revenue":87500.0,"total_bu":3500.0,"sold_price":25.0,"bu_per_ac":21.96},"2018":{"crop":"CC HAD","revenue":24500.0,"total_bu":4900.0,"sold_price":5.0,"bu_per_ac":30.74},"2019":{"crop":"CC WW","revenue":15481.16,"total_bu":3870.3,"sold_price":4.0,"bu_per_ac":24.28},"2020":{"crop":"Green Peas","revenue":28723.31,"total_bu":4103.3,"sold_price":7.0,"bu_per_ac":25.75},"2021":{"crop":"CC WW","total_bu":1593.8,"bu_per_ac":10.0},"2022":{"crop":"Chickpeas","total_bu":933.1,"bu_per_ac":5.85},"2023":{"crop":"Spring Wheat","total_bu":1695.1,"bu_per_ac":10.64},"2024":{"crop":"Austrians","revenue":30040.2,"total_bu":2225.2,"sold_price":13.5,"bu_per_ac":13.96},"2025":{"crop":"Mustard","total_bu":2841.0,"bu_per_ac":17.83}},
  "Cabin East|20-30N-5E":{"2015":{"crop":"Green Peas","revenue":18000.0,"total_bu":3000.0,"sold_price":6.0,"bu_per_ac":20.41},"2016":{"crop":"Austrians","revenue":18456.68,"total_bu":3469.3,"sold_price":5.32,"bu_per_ac":23.6},"2017":{"crop":"Chickpeas","revenue":87500.0,"total_bu":3500.0,"sold_price":25.0,"bu_per_ac":23.81},"2018":{"crop":"CC HAD","revenue":22750.0,"total_bu":4550.0,"sold_price":5.0,"bu_per_ac":30.96},"2019":{"crop":"Austrians","revenue":39150.0,"total_bu":4350.0,"sold_price":9.0,"bu_per_ac":29.6},"2020":{"crop":"CC WW","revenue":22604.85,"total_bu":5023.3,"sold_price":4.5,"bu_per_ac":34.18},"2022":{"crop":"Chickpeas","total_bu":789.6,"bu_per_ac":5.37},"2023":{"crop":"Spring Wheat","total_bu":2150.2,"bu_per_ac":14.63},"2024":{"crop":"Austrians","revenue":49206.15,"total_bu":3644.9,"sold_price":13.5,"bu_per_ac":24.8},"2025":{"crop":"Mustard","total_bu":2434.0,"bu_per_ac":16.56}},
  "STATE|21-30N-5E":{"2015":{"crop":"CC HAD","revenue":12525.78,"total_bu":1919.7,"sold_price":6.52,"bu_per_ac":26.57},"2017":{"crop":"CC HAD","revenue":17721.69,"total_bu":2531.7,"sold_price":7.0,"bu_per_ac":35.05},"2018":{"crop":"CC HAD","revenue":10365.0,"total_bu":2073.0,"sold_price":5.0,"bu_per_ac":28.7},"2019":{"crop":"CC WW","revenue":6783.56,"total_bu":1695.9,"sold_price":4.0,"bu_per_ac":23.48},"2020":{"crop":"Green Peas","revenue":13063.4,"total_bu":1866.2,"sold_price":7.0,"bu_per_ac":25.83},"2021":{"crop":"CC WW","total_bu":866.9,"bu_per_ac":12.0},"2022":{"crop":"Chickpeas","total_bu":430.7,"bu_per_ac":5.96},"2023":{"crop":"Spring Wheat","total_bu":969.9,"bu_per_ac":13.43},"2024":{"crop":"Austrians","revenue":12596.58,"total_bu":933.1,"sold_price":13.5,"bu_per_ac":12.92},"2025":{"crop":"Mustard","total_bu":1288.0,"bu_per_ac":17.83}},
  "South Rd.|07-30N-7E":{"2015":{"crop":"CC HAD","revenue":17571.13,"total_bu":2019.7,"sold_price":8.7,"bu_per_ac":7.03},"2017":{"crop":"sunflowers","revenue":31500.0,"total_bu":7500.0,"sold_price":4.2,"bu_per_ac":26.09},"2018":{"crop":"Austrians","revenue":5850.0,"total_bu":650.0,"sold_price":9.0,"bu_per_ac":2.26},"2019":{"crop":"CC WW","revenue":6857.96,"total_bu":1714.5,"sold_price":4.0,"bu_per_ac":5.96},"2020":{"crop":"Chickpeas","revenue":39200.0,"total_bu":2800.0,"sold_price":14.0,"bu_per_ac":9.74},"2021":{"crop":"CC WW","total_bu":574.9,"bu_per_ac":2.0},"2022":{"crop":"Lentils","total_bu":1.0},"2023":{"crop":"Spring Wheat","total_bu":5334.2,"bu_per_ac":18.56},"2024":{"crop":"Mustard","revenue":40471.2,"total_bu":1445.4,"sold_price":28.0,"bu_per_ac":5.03},"2025":{"crop":"Chickpeas","total_bu":500.1,"bu_per_ac":1.74}},
  "North 320|23-31N-7E":{"2015":{"crop":"CC HAD","revenue":14790.0,"total_bu":1700.0,"sold_price":8.7,"bu_per_ac":5.26},"2016":{"crop":"Chickpeas","revenue":207000.0,"total_bu":6900.0,"sold_price":30.0,"bu_per_ac":21.37},"2018":{"crop":"Winter Wheat","revenue":55000.0,"total_bu":10000.0,"sold_price":5.5,"bu_per_ac":30.97},"2019":{"crop":"Lentils","revenue":35583.03,"total_bu":3953.7,"sold_price":9.0,"bu_per_ac":12.24},"2020":{"crop":"CC WW","revenue":38035.5,"total_bu":8452.3,"sold_price":4.5,"bu_per_ac":26.18},"2021":{"crop":"Yellow Peas","total_bu":1414.3,"bu_per_ac":4.38},"2022":{"crop":"CC WW","total_bu":322.9,"bu_per_ac":1.0},"2023":{"crop":"Chickpeas","total_bu":2425.2,"bu_per_ac":7.51},"2024":{"crop":"Mustard","revenue":23153.2,"total_bu":826.9,"sold_price":28.0,"bu_per_ac":2.56},"2025":{"crop":"Lentils","total_bu":968.7,"bu_per_ac":3.0}},
  "West 320|27-31N-7E":{"2015":{"crop":"CC HAD","revenue":43769.87,"total_bu":5031.0,"sold_price":8.7,"bu_per_ac":15.32},"2016":{"crop":"Lentils","revenue":121323.22,"total_bu":7136.7,"sold_price":17.0,"bu_per_ac":21.74},"2017":{"crop":"Chickpeas","revenue":27722.4,"total_bu":1155.1,"sold_price":24.0,"bu_per_ac":3.52},"2018":{"crop":"CC HAD","revenue":8875.0,"total_bu":1775.0,"sold_price":5.0,"bu_per_ac":5.41},"2019":{"crop":"Austrians","revenue":82250.0,"total_bu":8225.0,"sold_price":10.0,"bu_per_ac":25.05},"2020":{"crop":"CC WW","revenue":35151.68,"total_bu":7811.5,"sold_price":4.5,"bu_per_ac":23.79},"2021":{"crop":"Yellow Peas","total_bu":1438.1,"bu_per_ac":4.38},"2022":{"crop":"CC WW","total_bu":298.8,"bu_per_ac":0.91},"2023":{"crop":"Chickpeas","total_bu":1690.2,"bu_per_ac":5.15},"2024":{"crop":"Mustard","revenue":40517.68,"total_bu":1447.1,"sold_price":28.0,"bu_per_ac":4.41},"2025":{"crop":"Lentils","total_bu":1516.0,"bu_per_ac":4.62}},
  "East 320|26-31N-7E":{"2015":{"crop":"CC HAD","revenue":18513.51,"total_bu":2128.0,"sold_price":8.7,"bu_per_ac":6.63},"2016":{"crop":"Lentils","revenue":132067.22,"total_bu":7768.7,"sold_price":17.0,"bu_per_ac":24.22},"2017":{"crop":"Chickpeas","revenue":61875.0,"total_bu":2475.0,"sold_price":25.0,"bu_per_ac":7.72},"2018":{"crop":"CC HAD","revenue":7265.0,"total_bu":1453.0,"sold_price":5.0,"bu_per_ac":4.53},"2019":{"crop":"Austrians","revenue":77000.0,"total_bu":7700.0,"sold_price":10.0,"bu_per_ac":24.0},"2020":{"crop":"CC WW","revenue":36366.61,"total_bu":8081.5,"sold_price":4.5,"bu_per_ac":25.19},"2021":{"crop":"Yellow Peas","total_bu":1405.1,"bu_per_ac":4.38},"2022":{"crop":"CC WW","total_bu":384.9,"bu_per_ac":1.2},"2023":{"crop":"Chickpeas","total_bu":2309.9,"bu_per_ac":7.2},"2024":{"crop":"Mustard","revenue":37623.6,"total_bu":1343.7,"sold_price":28.0,"bu_per_ac":4.19},"2025":{"crop":"Lentils","total_bu":904.0,"bu_per_ac":2.82}},
  "North 320|24-30N-5E":{"2015":{"crop":"CC WW","revenue":49500.0,"total_bu":9900.0,"sold_price":5.0,"bu_per_ac":31.57},"2016":{"crop":"Green Peas","revenue":32400.0,"total_bu":5400.0,"sold_price":6.0,"bu_per_ac":17.22},"2017":{"crop":"CC HAD","revenue":26688.0,"total_bu":3336.0,"sold_price":8.0,"bu_per_ac":10.64},"2019":{"crop":"oats","revenue":25500.0,"total_bu":12750.0,"sold_price":2.0,"bu_per_ac":40.66}},
  "South 480|25-30N-5E":{"2015":{"crop":"CC WW","revenue":49069.13,"total_bu":8921.7,"sold_price":5.5,"bu_per_ac":28.06},"2016":{"crop":"Lentils","revenue":96900.0,"total_bu":5700.0,"sold_price":17.0,"bu_per_ac":17.93},"2017":{"crop":"Chickpeas","revenue":79000.0,"total_bu":3160.0,"sold_price":25.0,"bu_per_ac":9.94}},
  "South 480|26-30N-5E":{"2015":{"crop":"CC WW","revenue":20000.0,"total_bu":4000.0,"sold_price":5.0,"bu_per_ac":25.43},"2016":{"crop":"Lentils","revenue":48784.22,"total_bu":2869.7,"sold_price":17.0,"bu_per_ac":18.24},"2017":{"crop":"Chickpeas","revenue":22902.5,"total_bu":916.1,"sold_price":25.0,"bu_per_ac":5.82},"2019":{"crop":"Flax","revenue":19177.02,"total_bu":2191.7,"sold_price":8.75,"bu_per_ac":13.93}},
  "Decker yard W|07-30N-6E":{"2015":{"crop":"CC WW","revenue":32000.0,"total_bu":6400.0,"sold_price":5.0,"bu_per_ac":40.53},"2017":{"crop":"Winter Wheat","revenue":28000.0,"total_bu":7000.0,"sold_price":4.0,"bu_per_ac":44.33},"2018":{"crop":"Austrians","revenue":18450.0,"total_bu":2050.0,"sold_price":9.0,"bu_per_ac":12.98},"2020":{"crop":"Chickpeas","revenue":28000.0,"total_bu":2000.0,"sold_price":14.0,"bu_per_ac":12.66},"2021":{"crop":"CC WW","total_bu":473.8,"bu_per_ac":3.0},"2022":{"crop":"Lentils","total_bu":488.0,"bu_per_ac":3.09},"2023":{"crop":"Mustard","total_bu":445.3,"bu_per_ac":2.82},"2024":{"crop":"Chickpeas","revenue":12375.2,"total_bu":618.8,"sold_price":20.0,"bu_per_ac":3.92}},
  "Decker yard E|08-30N-6E":{"2015":{"crop":"CC WW","revenue":24506.7,"total_bu":4901.3,"sold_price":5.0,"bu_per_ac":35.96},"2017":{"crop":"Winter Wheat","revenue":23644.32,"total_bu":5911.1,"sold_price":4.0,"bu_per_ac":43.37},"2018":{"crop":"Austrians","revenue":15300.0,"total_bu":1700.0,"sold_price":9.0,"bu_per_ac":12.47},"2020":{"crop":"Chickpeas","revenue":28000.0,"total_bu":2000.0,"sold_price":14.0,"bu_per_ac":14.67},"2021":{"crop":"CC WW","total_bu":408.9,"bu_per_ac":3.0},"2022":{"crop":"Lentils","total_bu":428.0,"bu_per_ac":3.14},"2023":{"crop":"Mustard","total_bu":384.3,"bu_per_ac":2.82},"2024":{"crop":"Chickpeas","revenue":11607.4,"total_bu":580.4,"sold_price":20.0,"bu_per_ac":4.26}},
  "Decker Yard|08-30N-6E":{"2015":{"crop":"CC WW","revenue":1000.0,"total_bu":200.0,"sold_price":5.0,"bu_per_ac":16.91},"2017":{"crop":"Winter Wheat","revenue":2000.0,"total_bu":500.0,"sold_price":4.0,"bu_per_ac":42.27},"2018":{"crop":"Austrians","revenue":1350.0,"total_bu":150.0,"sold_price":9.0,"bu_per_ac":12.68},"2020":{"crop":"Chickpeas","revenue":3024.0,"total_bu":216.0,"sold_price":14.0,"bu_per_ac":18.26},"2021":{"crop":"CC WW","total_bu":35.5,"bu_per_ac":3.0},"2022":{"crop":"Lentils","total_bu":30.0,"bu_per_ac":2.54},"2023":{"crop":"Mustard","total_bu":34.6,"bu_per_ac":2.93},"2024":{"crop":"Chickpeas","revenue":1000.0,"total_bu":50.0,"sold_price":20.0,"bu_per_ac":4.23}},
  "North 320|16-31N-5E":{"2016":{"crop":"Winter Wheat","revenue":83600.0,"total_bu":20900.0,"sold_price":4.0,"bu_per_ac":66.39}},
  "West 50s|31-31N-5E":{"2016":{"crop":"Winter Wheat","revenue":92400.0,"total_bu":23100.0,"sold_price":4.0,"bu_per_ac":73.22},"2017":{"crop":"Yellow Peas","revenue":42309.0,"total_bu":4701.0,"sold_price":9.0,"bu_per_ac":14.9},"2019":{"crop":"CC WW","revenue":65533.56,"total_bu":10922.3,"sold_price":6.0,"bu_per_ac":34.62},"2020":{"crop":"Yellow Peas","revenue":60370.1,"total_bu":8624.3,"sold_price":7.0,"bu_per_ac":27.34},"2021":{"crop":"CC WW","total_bu":630.9,"bu_per_ac":2.0},"2022":{"crop":"Chickpeas","total_bu":3120.2,"bu_per_ac":9.89},"2023":{"crop":"Spring Wheat","total_bu":4838.6,"bu_per_ac":15.34},"2024":{"crop":"Mustard","revenue":20746.6,"total_bu":741.0,"sold_price":28.0,"bu_per_ac":2.35},"2025":{"crop":"CC WW","total_bu":7630.0,"bu_per_ac":24.19}},
  "South Poles|32-31N-5E":{"2016":{"crop":"Chickpeas","revenue":42400.0,"total_bu":2650.0,"sold_price":16.0,"bu_per_ac":16.92},"2017":{"crop":"CC HAD","revenue":16072.0,"total_bu":2009.0,"sold_price":8.0,"bu_per_ac":12.83},"2018":{"crop":"Lentils","revenue":12150.0,"total_bu":1350.0,"sold_price":9.0,"bu_per_ac":8.62},"2020":{"crop":"Chickpeas","revenue":680.0,"total_bu":85.0,"sold_price":8.0,"bu_per_ac":0.54},"2022":{"crop":"Flax","total_bu":254.7,"bu_per_ac":1.63},"2023":{"crop":"Lentils","total_bu":638.7,"bu_per_ac":4.08},"2024":{"crop":"Mustard","revenue":19600.0,"total_bu":700.0,"sold_price":28.0,"bu_per_ac":4.47},"2025":{"crop":"Spring Wheat","total_bu":2952.0,"bu_per_ac":18.85}},
  "North Hendrickson|21-31N-5E":{"2016":{"crop":"Winter Wheat","revenue":63613.2,"total_bu":15903.3,"sold_price":4.0,"bu_per_ac":99.09},"2017":{"crop":"Lentils","revenue":57600.0,"total_bu":3200.0,"sold_price":18.0,"bu_per_ac":19.94},"2019":{"crop":"Chickpeas","revenue":100080.0,"total_bu":8340.0,"sold_price":12.0,"bu_per_ac":51.97},"2021":{"crop":"Yellow Peas","total_bu":319.9,"bu_per_ac":1.99},"2022":{"crop":"CC WW","total_bu":3412.1,"bu_per_ac":21.26},"2023":{"crop":"Chickpeas","total_bu":3179.7,"bu_per_ac":19.81},"2024":{"crop":"Mustard","revenue":61944.4,"total_bu":2212.3,"sold_price":28.0,"bu_per_ac":13.78},"2025":{"crop":"Austrians","total_bu":6538.9,"bu_per_ac":40.74}},
  "Joplin Rd|03-30N-7E":{"2016":{"crop":"Winter Wheat","revenue":14000.0,"total_bu":3500.0,"sold_price":4.0,"bu_per_ac":31.46},"2019":{"crop":"CC HAD","revenue":9100.0,"total_bu":1300.0,"sold_price":7.0,"bu_per_ac":11.68},"2020":{"crop":"Mustard","revenue":9450.0,"total_bu":700.0,"sold_price":13.5,"bu_per_ac":6.29},"2021":{"crop":"CC WW","total_bu":667.6,"bu_per_ac":6.0},"2022":{"crop":"Lentils","total_bu":0.1},"2023":{"crop":"Mustard","total_bu":895.3,"bu_per_ac":8.05}},
  "Joplin Rd|02-30N-7E":{"2016":{"crop":"Winter Wheat","revenue":18000.0,"total_bu":4500.0,"sold_price":4.0,"bu_per_ac":31.49},"2019":{"crop":"CC HAD","revenue":9100.0,"total_bu":1300.0,"sold_price":7.0,"bu_per_ac":9.1},"2020":{"crop":"Mustard","revenue":12150.0,"total_bu":900.0,"sold_price":13.5,"bu_per_ac":6.3},"2021":{"crop":"CC WW","total_bu":857.5,"bu_per_ac":6.0},"2022":{"crop":"Lentils","total_bu":0.1},"2023":{"crop":"Mustard","total_bu":1223.1,"bu_per_ac":8.56}},
  "Joplin Rd|11-30N-7E":{"2016":{"crop":"Winter Wheat","revenue":58500.0,"total_bu":13000.0,"sold_price":4.5,"bu_per_ac":32.86},"2019":{"crop":"CC HAD","revenue":23100.0,"total_bu":3300.0,"sold_price":7.0,"bu_per_ac":8.34},"2020":{"crop":"Mustard","revenue":40959.0,"total_bu":3034.0,"sold_price":13.5,"bu_per_ac":7.67},"2021":{"crop":"CC WW","total_bu":2373.8,"bu_per_ac":6.0},"2022":{"crop":"Lentils","total_bu":0.1},"2023":{"crop":"Mustard","total_bu":3297.6,"bu_per_ac":8.33}},
  "Blow Field|06-30N-5E":{"2016":{"crop":"Winter Wheat","revenue":50728.5,"total_bu":11273.0,"sold_price":4.5,"bu_per_ac":70.73},"2017":{"crop":"Chickpeas","revenue":62500.0,"total_bu":2500.0,"sold_price":25.0,"bu_per_ac":15.69},"2018":{"crop":"CC HAD","revenue":20500.0,"total_bu":4100.0,"sold_price":5.0,"bu_per_ac":25.73},"2019":{"crop":"CC WW","revenue":16316.0,"total_bu":4079.0,"sold_price":4.0,"bu_per_ac":25.59},"2020":{"crop":"Lentils","revenue":40918.5,"total_bu":2727.9,"sold_price":15.0,"bu_per_ac":17.12},"2021":{"crop":"Chickpeas","total_bu":223.1,"bu_per_ac":1.4},"2022":{"crop":"Spring Wheat","total_bu":288.1,"bu_per_ac":1.81},"2023":{"crop":"Lentils","revenue":1530.0,"total_bu":85.0,"sold_price":18.0,"bu_per_ac":0.53},"2024":{"crop":"Mustard","revenue":22195.6,"total_bu":792.7,"sold_price":28.0,"bu_per_ac":4.97},"2025":{"crop":"Chickpeas","total_bu":170.0,"bu_per_ac":1.07}},
  "West CRP|12-30N-4E":{"2016":{"crop":"Austrians","revenue":26400.0,"total_bu":3300.0,"sold_price":8.0,"bu_per_ac":16.01},"2018":{"crop":"Winter Wheat","revenue":58448.5,"total_bu":10627.0,"sold_price":5.5,"bu_per_ac":51.57},"2019":{"crop":"Chickpeas","revenue":34000.0,"total_bu":3400.0,"sold_price":10.0,"bu_per_ac":16.5},"2020":{"crop":"CC WW","revenue":25211.73,"total_bu":5602.6,"sold_price":4.5,"bu_per_ac":27.19},"2021":{"crop":"Yellow Peas","total_bu":206.1,"bu_per_ac":1.0},"2022":{"crop":"CC WW","total_bu":1261.8,"bu_per_ac":6.12},"2023":{"crop":"Chickpeas","total_bu":940.8,"bu_per_ac":4.57},"2024":{"crop":"Mustard","revenue":20701.52,"total_bu":739.3,"sold_price":28.0,"bu_per_ac":3.59},"2025":{"crop":"Lentils","total_bu":2089.4,"bu_per_ac":10.14}},
  "Pivot CRP|19-30N-5E":{"2016":{"crop":"Austrians","revenue":3229.36,"total_bu":403.7,"sold_price":8.0,"bu_per_ac":16.22},"2019":{"crop":"Austrians","revenue":3150.0,"total_bu":350.0,"sold_price":9.0,"bu_per_ac":14.06},"2020":{"crop":"Flax","revenue":4000.0,"total_bu":400.0,"sold_price":10.0,"bu_per_ac":16.07},"2021":{"crop":"Spring Wheat","total_bu":224.0,"bu_per_ac":9.0},"2022":{"crop":"Yellow Peas","total_bu":35.6,"bu_per_ac":1.43},"2024":{"crop":"corn","revenue":1680.0,"total_bu":350.0,"sold_price":4.8,"bu_per_ac":14.06},"2025":{"crop":"Austrians","total_bu":155.6,"bu_per_ac":6.25}},
  "island|20-30N-5E":{"2016":{"crop":"Austrians","revenue":1253.36,"total_bu":156.7,"sold_price":8.0,"bu_per_ac":17.6},"2018":{"crop":"CC HAD","revenue":1150.0,"total_bu":230.0,"sold_price":5.0,"bu_per_ac":25.84},"2019":{"crop":"Austrians","revenue":2250.0,"total_bu":250.0,"sold_price":9.0,"bu_per_ac":28.09},"2020":{"crop":"CC WW","revenue":1426.18,"total_bu":316.9,"sold_price":4.5,"bu_per_ac":35.61},"2022":{"crop":"Austrians","total_bu":32.4,"bu_per_ac":3.64},"2023":{"crop":"Spring Wheat","total_bu":103.2,"bu_per_ac":11.6},"2024":{"crop":"Mustard","revenue":560.0,"total_bu":20.0,"sold_price":28.0,"bu_per_ac":2.25},"2025":{"crop":"Chickpeas","total_bu":101.0,"bu_per_ac":11.35}},
  "BOR|20-30N-5E":{"2016":{"crop":"Winter Wheat","revenue":5924.0,"total_bu":1481.0,"sold_price":4.0,"bu_per_ac":45.36},"2018":{"crop":"CC HAD","revenue":4000.0,"total_bu":800.0,"sold_price":5.0,"bu_per_ac":24.5},"2019":{"crop":"Austrians","revenue":10500.0,"total_bu":1050.0,"sold_price":10.0,"bu_per_ac":32.16},"2020":{"crop":"CC WW","revenue":5400.0,"total_bu":1200.0,"sold_price":4.5,"bu_per_ac":36.75},"2022":{"crop":"Austrians","total_bu":110.0,"bu_per_ac":3.37},"2023":{"crop":"Spring Wheat","total_bu":379.4,"bu_per_ac":11.62},"2024":{"crop":"Mustard","revenue":1624.0,"total_bu":58.0,"sold_price":28.0,"bu_per_ac":1.78},"2025":{"crop":"Chickpeas","total_bu":370.0,"bu_per_ac":11.33}},
  "STATE|06-30N-7E":{"2016":{"crop":"Winter Wheat","revenue":33975.0,"total_bu":7550.0,"sold_price":4.5,"bu_per_ac":34.12},"2018":{"crop":"CC HAD","revenue":30020.0,"total_bu":6004.0,"sold_price":5.0,"bu_per_ac":27.14},"2019":{"crop":"CC WW","revenue":21058.36,"total_bu":5264.6,"sold_price":4.0,"bu_per_ac":23.79},"2020":{"crop":"Chickpeas","revenue":44800.0,"total_bu":3200.0,"sold_price":14.0,"bu_per_ac":14.46},"2021":{"crop":"CC WW","total_bu":663.8,"bu_per_ac":3.0},"2022":{"crop":"Mustard","total_bu":287.1,"bu_per_ac":1.3},"2023":{"crop":"Spring Wheat","total_bu":3730.6,"bu_per_ac":16.86},"2024":{"crop":"Chickpeas","revenue":14964.8,"total_bu":748.2,"sold_price":20.0,"bu_per_ac":3.38}},
  "STATE|07-30N-7E":{"2016":{"crop":"Winter Wheat","revenue":9000.0,"total_bu":2000.0,"sold_price":4.5,"bu_per_ac":27.4},"2017":{"crop":"sunflowers","revenue":5040.0,"total_bu":1200.0,"sold_price":4.2,"bu_per_ac":16.44},"2018":{"crop":"Austrians","revenue":4500.0,"total_bu":500.0,"sold_price":9.0,"bu_per_ac":6.85},"2019":{"crop":"CC WW","revenue":6339.88,"total_bu":1585.0,"sold_price":4.0,"bu_per_ac":21.71},"2020":{"crop":"Chickpeas","revenue":10049.2,"total_bu":717.8,"sold_price":14.0,"bu_per_ac":9.83},"2022":{"crop":"Lentils","total_bu":60.4,"bu_per_ac":0.83},"2023":{"crop":"Spring Wheat","total_bu":1230.7,"bu_per_ac":16.86},"2024":{"crop":"Chickpeas","revenue":2568.0,"total_bu":128.4,"sold_price":20.0,"bu_per_ac":1.76},"2025":{"crop":"Spring Wheat","total_bu":959.0,"bu_per_ac":13.14}},
  "North Rd|06-30N-7E":{"2016":{"crop":"Winter Wheat","revenue":56700.0,"total_bu":12600.0,"sold_price":4.5,"bu_per_ac":32.88},"2018":{"crop":"Austrians","revenue":61155.0,"total_bu":6795.0,"sold_price":9.0,"bu_per_ac":17.73},"2019":{"crop":"CC WW","revenue":45690.6,"total_bu":11422.6,"sold_price":4.0,"bu_per_ac":29.81},"2020":{"crop":"Chickpeas","revenue":81200.0,"total_bu":5800.0,"sold_price":14.0,"bu_per_ac":15.14},"2021":{"crop":"CC WW","total_bu":1915.9,"bu_per_ac":5.0},"2022":{"crop":"Mustard","total_bu":495.0,"bu_per_ac":1.29},"2023":{"crop":"Spring Wheat","total_bu":8543.5,"bu_per_ac":22.3},"2024":{"crop":"Chickpeas","revenue":26000.0,"total_bu":1300.0,"sold_price":20.0,"bu_per_ac":3.39},"2025":{"crop":"Spring Wheat","total_bu":6178.0,"bu_per_ac":16.12}},
  "N. 320|24-31N-6":{"2016":{"crop":"Winter Wheat","revenue":22500.0,"total_bu":5000.0,"sold_price":4.5,"bu_per_ac":47.61},"2017":{"crop":"Chickpeas","revenue":175000.0,"total_bu":7000.0,"sold_price":25.0,"bu_per_ac":66.65},"2020":{"crop":"Green Peas","revenue":76421.1,"total_bu":10917.3,"sold_price":7.0,"bu_per_ac":103.94},"2021":{"crop":"CC WW","total_bu":1276.0,"bu_per_ac":12.15},"2022":{"crop":"Lentils","total_bu":389.2,"bu_per_ac":3.71},"2023":{"crop":"Mustard","total_bu":311.1,"bu_per_ac":2.96},"2024":{"crop":"Chickpeas","revenue":58244.0,"total_bu":2912.2,"sold_price":20.0,"bu_per_ac":27.74},"2025":{"crop":"CC HAD","total_bu":6453.4,"bu_per_ac":61.46}},
  "East Section|25-31N-6":{"2016":{"crop":"Winter Wheat","revenue":91350.0,"total_bu":20300.0,"sold_price":4.5,"bu_per_ac":43.8},"2017":{"crop":"Austrians","revenue":45000.0,"total_bu":5000.0,"sold_price":9.0,"bu_per_ac":10.79},"2020":{"crop":"Chickpeas","revenue":101495.8,"total_bu":7249.7,"sold_price":14.0,"bu_per_ac":15.64},"2021":{"crop":"CC WW","total_bu":3205.8,"bu_per_ac":6.92},"2022":{"crop":"Lentils","total_bu":27.8,"bu_per_ac":0.06},"2024":{"crop":"Spring Wheat","revenue":39523.12,"total_bu":6826.1,"sold_price":5.79,"bu_per_ac":14.73},"2025":{"crop":"Mustard","total_bu":2679.6,"bu_per_ac":5.78}},
  "House|26-31N-6E":{"2016":{"crop":"Lentils","revenue":20659.95,"total_bu":1377.3,"sold_price":15.0,"bu_per_ac":2.43},"2018":{"crop":"Winter Wheat","revenue":119245.5,"total_bu":21681.0,"sold_price":5.5,"bu_per_ac":38.33},"2019":{"crop":"Chickpeas","revenue":76950.0,"total_bu":8550.0,"sold_price":9.0,"bu_per_ac":15.12},"2020":{"crop":"CC WW","revenue":65347.59,"total_bu":14521.7,"sold_price":4.5,"bu_per_ac":25.67},"2022":{"crop":"Spring Wheat","total_bu":2768.7,"bu_per_ac":4.89},"2023":{"crop":"Chickpeas","total_bu":2491.8,"bu_per_ac":4.4},"2024":{"crop":"Spring Wheat","revenue":42950.22,"total_bu":7418.0,"sold_price":5.79,"bu_per_ac":13.11},"2025":{"crop":"Austrians","total_bu":10406.0,"bu_per_ac":18.4}},
  "West Section|27-31N-6E":{"2016":{"crop":"Winter Wheat","revenue":123467.2,"total_bu":7716.7,"sold_price":16.0,"bu_per_ac":84.8},"2018":{"crop":"Winter Wheat","revenue":98246.5,"total_bu":17863.0,"sold_price":5.5,"bu_per_ac":1832.1},"2019":{"crop":"Lentils","revenue":56630.7,"total_bu":6292.3,"sold_price":9.0,"bu_per_ac":645.36},"2020":{"crop":"CC WW","revenue":52463.25,"total_bu":11658.5,"sold_price":4.5,"bu_per_ac":1195.74},"2021":{"crop":"Chickpeas","total_bu":1008.5,"bu_per_ac":103.44},"2022":{"crop":"Spring Wheat","total_bu":2374.2,"bu_per_ac":243.51},"2023":{"crop":"Austrians","total_bu":6488.5,"bu_per_ac":664.81},"2024":{"crop":"Mustard","revenue":66802.4,"total_bu":2385.8,"sold_price":28.0,"bu_per_ac":244.45},"2025":{"crop":"Chickpeas","total_bu":6093.0,"bu_per_ac":624.28}},
  "North Tiber Grade|16-31N-5E":{"2017":{"crop":"Lentils","revenue":63000.0,"total_bu":3500.0,"sold_price":18.0,"bu_per_ac":11.12},"2018":{"crop":"Chickpeas","revenue":64200.0,"total_bu":5350.0,"sold_price":12.0,"bu_per_ac":17.0},"2019":{"crop":"CC WW","revenue":26858.16,"total_bu":6714.5,"sold_price":4.0,"bu_per_ac":21.33},"2020":{"crop":"Yellow Peas","revenue":805.86,"total_bu":100.7,"sold_price":8.0,"bu_per_ac":0.32},"2021":{"crop":"Barley","total_bu":1574.0,"bu_per_ac":5.0},"2022":{"crop":"Chickpeas","total_bu":2918.4,"bu_per_ac":9.27},"2023":{"crop":"Spring Wheat","total_bu":6953.1,"bu_per_ac":22.09},"2024":{"crop":"Lentils","revenue":28738.8,"total_bu":1064.4,"sold_price":27.0,"bu_per_ac":3.38},"2025":{"crop":"CC HAD","total_bu":6509.0,"bu_per_ac":20.68}},
  "Northwest 640|32-32N-7E":{"2019":{"crop":"Mustard","revenue":57500.0,"total_bu":5750.0,"sold_price":10.0,"bu_per_ac":9.02},"2020":{"crop":"CC WW","revenue":66900.69,"total_bu":14866.8,"sold_price":4.5,"bu_per_ac":23.31},"2021":{"crop":"Chickpeas","total_bu":637.8,"bu_per_ac":1.0}},
  "Southwest 640|05-31N-7E":{"2019":{"crop":"Flax","revenue":36050.0,"total_bu":4120.0,"sold_price":8.75,"bu_per_ac":6.63},"2020":{"crop":"CC WW","revenue":70966.08,"total_bu":15770.2,"sold_price":4.5,"bu_per_ac":25.37},"2021":{"crop":"Chickpeas","total_bu":1529.4,"bu_per_ac":2.46}},
  "North Building site|33-30N-3E":{"2019":{"crop":"Austrians","revenue":5310.0,"total_bu":590.0,"sold_price":9.0,"bu_per_ac":16.25},"2020":{"crop":"Spring Wheat","revenue":7532.25,"total_bu":1506.5,"sold_price":5.0,"bu_per_ac":41.5},"2021":{"crop":"Mustard","total_bu":72.6,"bu_per_ac":2.0},"2023":{"crop":"Austrians","total_bu":256.4,"bu_per_ac":7.06},"2024":{"crop":"Spring Wheat","revenue":3029.91,"total_bu":523.3,"sold_price":5.79,"bu_per_ac":14.42},"2025":{"crop":"Lentils","total_bu":223.2,"bu_per_ac":6.15}},
  "West building site|33-30N-3E":{"2019":{"crop":"Spring Wheat","revenue":21091.5,"total_bu":2343.5,"sold_price":9.0,"bu_per_ac":57.13},"2020":{"crop":"Chickpeas","revenue":13759.0,"total_bu":2751.8,"sold_price":5.0,"bu_per_ac":67.08},"2021":{"crop":"Spring Wheat","total_bu":1069.1,"bu_per_ac":26.06},"2022":{"crop":"Green Peas","total_bu":569.3,"bu_per_ac":13.88},"2023":{"crop":"CC WW","total_bu":982.2,"bu_per_ac":23.94},"2024":{"crop":"Chickpeas","revenue":4066.32,"total_bu":702.3,"sold_price":5.79,"bu_per_ac":17.12},"2025":{"crop":"CC HAD","total_bu":860.0,"bu_per_ac":20.97}},
  "Rock Hilltop|32-30N-3E":{"2019":{"crop":"Spring Wheat","revenue":20718.0,"total_bu":2302.0,"sold_price":9.0,"bu_per_ac":56.62},"2020":{"crop":"Austrians","revenue":15829.5,"total_bu":3165.9,"sold_price":5.0,"bu_per_ac":77.86},"2021":{"crop":"Spring Wheat","total_bu":1586.8,"bu_per_ac":39.03},"2022":{"crop":"Chickpeas","total_bu":1078.4,"bu_per_ac":26.52},"2023":{"crop":"CC WW","total_bu":2508.0,"bu_per_ac":61.68},"2024":{"crop":"Green Peas","revenue":11661.04,"total_bu":2063.9,"sold_price":5.65,"bu_per_ac":50.76},"2025":{"crop":"CC WW","total_bu":585.0,"bu_per_ac":14.39}},
  "west kirby house|3-29N-3E":{"2019":{"crop":"Spring Wheat","revenue":79190.65,"total_bu":14398.3,"sold_price":5.5,"bu_per_ac":99.03},"2020":{"crop":"Austrians","revenue":35577.6,"total_bu":4447.2,"sold_price":8.0,"bu_per_ac":30.59},"2021":{"crop":"Spring Wheat","total_bu":5125.7,"bu_per_ac":35.25},"2022":{"crop":"Chickpeas","total_bu":2080.2,"bu_per_ac":14.31},"2023":{"crop":"CC WW","total_bu":8945.4,"bu_per_ac":61.52},"2024":{"crop":"Green Peas","revenue":20363.4,"total_bu":2262.6,"sold_price":9.0,"bu_per_ac":15.56},"2025":{"crop":"CC HAD","total_bu":5906.0,"bu_per_ac":40.62}},
  "west Hauser Rd.|3-29N-3E":{"2019":{"crop":"Spring Wheat","revenue":88290.0,"total_bu":9810.0,"sold_price":9.0,"bu_per_ac":61.83},"2020":{"crop":"Chickpeas","revenue":52474.0,"total_bu":10494.8,"sold_price":5.0,"bu_per_ac":66.15},"2021":{"crop":"Spring Wheat","total_bu":2942.8,"bu_per_ac":18.55},"2022":{"crop":"Green Peas","total_bu":2493.9,"bu_per_ac":15.72},"2023":{"crop":"CC WW","total_bu":10937.3,"bu_per_ac":68.94},"2024":{"crop":"Chickpeas","revenue":16628.3,"total_bu":2871.9,"sold_price":5.79,"bu_per_ac":18.1},"2025":{"crop":"CC HAD","total_bu":4507.0,"bu_per_ac":28.41}},
  "South Rock Hilltop|5-29N-3E":{"2019":{"crop":"Spring Wheat","revenue":51300.0,"total_bu":5700.0,"sold_price":9.0,"bu_per_ac":72.14},"2020":{"crop":"Austrians","revenue":30826.0,"total_bu":6165.2,"sold_price":5.0,"bu_per_ac":78.03},"2021":{"crop":"Spring Wheat","total_bu":1677.7,"bu_per_ac":21.23},"2022":{"crop":"Chickpeas","total_bu":2083.8,"bu_per_ac":26.37},"2023":{"crop":"CC WW","total_bu":3022.3,"bu_per_ac":38.25},"2024":{"crop":"Green Peas","revenue":19990.83,"total_bu":3538.2,"sold_price":5.65,"bu_per_ac":44.78},"2025":{"crop":"CC WW","total_bu":1961.0,"bu_per_ac":24.82}},
  "far west north place|5-29N-3E":{"2019":{"crop":"Spring Wheat","revenue":132354.0,"total_bu":14706.0,"sold_price":9.0,"bu_per_ac":186.7},"2020":{"crop":"Austrians","revenue":63484.0,"total_bu":12696.8,"sold_price":5.0,"bu_per_ac":161.19},"2021":{"crop":"Spring Wheat","total_bu":5166.6,"bu_per_ac":65.59},"2022":{"crop":"Chickpeas","total_bu":1609.4,"bu_per_ac":20.43},"2023":{"crop":"CC WW","total_bu":5904.7,"bu_per_ac":74.96},"2024":{"crop":"Green Peas","revenue":29569.28,"total_bu":5233.5,"sold_price":5.65,"bu_per_ac":66.44},"2025":{"crop":"CC WW","total_bu":4400.0,"bu_per_ac":55.86}},
  "Old House West|8-29N-3E":{"2019":{"crop":"Spring Wheat","revenue":32450.0,"total_bu":5900.0,"sold_price":5.5,"bu_per_ac":37.05},"2020":{"crop":"Austrians","revenue":33760.0,"total_bu":4220.0,"sold_price":8.0,"bu_per_ac":26.5},"2021":{"crop":"Spring Wheat","total_bu":3025.6,"bu_per_ac":19.0},"2022":{"crop":"Chickpeas","total_bu":2177.4,"bu_per_ac":13.67},"2023":{"crop":"CC WW","total_bu":4523.5,"bu_per_ac":28.41},"2024":{"crop":"Green Peas","revenue":7855.2,"total_bu":872.8,"sold_price":9.0,"bu_per_ac":5.48},"2025":{"crop":"CC WW","total_bu":2398.0,"bu_per_ac":15.06}},
  "South Kirby corner|10-29N-3E":{"2019":{"crop":"Spring Wheat","revenue":23549.19,"total_bu":4281.7,"sold_price":5.5,"bu_per_ac":56.66},"2020":{"crop":"Austrians","revenue":20666.64,"total_bu":2583.3,"sold_price":8.0,"bu_per_ac":34.18},"2021":{"crop":"Spring Wheat","total_bu":755.7,"bu_per_ac":10.0},"2022":{"crop":"Chickpeas","total_bu":729.8,"bu_per_ac":9.66},"2023":{"crop":"CC WW","total_bu":1390.3,"bu_per_ac":18.4},"2024":{"crop":"Green Peas","revenue":4030.2,"total_bu":447.8,"sold_price":9.0,"bu_per_ac":5.93},"2025":{"crop":"CC WW","total_bu":1291.0,"bu_per_ac":17.08}},
  "west home reservoir|11-29N-3E":{"2019":{"crop":"Spring Wheat","revenue":20073.19,"total_bu":3649.7,"sold_price":5.5,"bu_per_ac":56.72},"2020":{"crop":"Flax","revenue":10000.0,"total_bu":1000.0,"sold_price":10.0,"bu_per_ac":15.54},"2021":{"crop":"Spring Wheat","total_bu":836.5,"bu_per_ac":13.0},"2022":{"crop":"Green Peas","total_bu":146.0,"bu_per_ac":2.27},"2023":{"crop":"CC WW","total_bu":1239.5,"bu_per_ac":19.26},"2024":{"crop":"Chickpeas","revenue":9416.0,"total_bu":470.8,"sold_price":20.0,"bu_per_ac":7.32},"2025":{"crop":"CC WW","total_bu":619.5,"bu_per_ac":9.63}},
  "N1/2 St. Olaf|23-29N-3E":{"2019":{"crop":"Spring Wheat","revenue":57672.0,"total_bu":6408.0,"sold_price":9.0,"bu_per_ac":81.55},"2020":{"crop":"Austrians","revenue":19248.5,"total_bu":3849.7,"sold_price":5.0,"bu_per_ac":48.99},"2021":{"crop":"Spring Wheat","total_bu":1719.2,"bu_per_ac":21.88},"2022":{"crop":"Chickpeas","total_bu":355.9,"bu_per_ac":4.56},"2023":{"crop":"CC WW","total_bu":1778.2,"bu_per_ac":22.63},"2024":{"crop":"Green Peas","revenue":15787.23,"total_bu":2794.2,"sold_price":5.65,"bu_per_ac":35.56},"2025":{"crop":"CC HAD","total_bu":2093.0,"bu_per_ac":26.64}},
  "S1/2 St. Olaf|23-29N-3E":{"2019":{"crop":"Spring Wheat","revenue":57903.3,"total_bu":6433.7,"sold_price":9.0,"bu_per_ac":79.51},"2020":{"crop":"Austrians","revenue":19430.0,"total_bu":3886.0,"sold_price":5.0,"bu_per_ac":48.02},"2021":{"crop":"Spring Wheat","total_bu":1796.5,"bu_per_ac":22.2},"2022":{"crop":"Chickpeas","total_bu":889.8,"bu_per_ac":11.23},"2023":{"crop":"CC WW","total_bu":2157.7,"bu_per_ac":26.66},"2024":{"crop":"Green Peas","revenue":10125.36,"total_bu":1792.1,"sold_price":5.65,"bu_per_ac":22.15},"2025":{"crop":"CC HAD","total_bu":2105.0,"bu_per_ac":26.01}},
  "Shotgun Slough|29-29N-3E":{"2019":{"crop":"Chickpeas","revenue":3150.0,"total_bu":350.0,"sold_price":9.0,"bu_per_ac":2.17},"2020":{"crop":"Spring Wheat","revenue":30311.7,"total_bu":6062.3,"sold_price":5.0,"bu_per_ac":37.63},"2021":{"crop":"Green Peas","total_bu":786.2,"bu_per_ac":4.88},"2023":{"crop":"CC WW","total_bu":302.1,"bu_per_ac":1.88},"2024":{"crop":"Lentils","total_bu":800.0,"bu_per_ac":4.97},"2025":{"crop":"Mustard","total_bu":207.0,"bu_per_ac":1.28}},
  "West 200|31-29N-3E":{"2019":{"crop":"Spring Wheat","revenue":71127.76,"total_bu":12932.3,"sold_price":5.5,"bu_per_ac":63.99},"2020":{"crop":"Chickpeas","revenue":51084.0,"total_bu":4257.0,"sold_price":12.0,"bu_per_ac":21.06},"2021":{"crop":"Spring Wheat","total_bu":1819.0,"bu_per_ac":9.0},"2022":{"crop":"Austrians","revenue":5278.09,"total_bu":399.9,"sold_price":13.2,"bu_per_ac":1.98},"2023":{"crop":"CC WW","total_bu":9153.1,"bu_per_ac":45.29},"2024":{"crop":"Lentils","revenue":58272.5,"total_bu":2119.0,"sold_price":27.5,"bu_per_ac":10.48},"2025":{"crop":"CC WW","total_bu":2160.0,"bu_per_ac":10.69}},
  "South Shotgun|32-29N-3E":{"2019":{"crop":"Spring Wheat","revenue":225123.3,"total_bu":25013.7,"sold_price":9.0,"bu_per_ac":91.55},"2020":{"crop":"Chickpeas","revenue":82612.5,"total_bu":16522.5,"sold_price":5.0,"bu_per_ac":60.47},"2021":{"crop":"Spring Wheat","total_bu":8405.7,"bu_per_ac":30.76},"2022":{"crop":"Austrians","revenue":24827.88,"total_bu":1880.9,"sold_price":13.2,"bu_per_ac":6.88},"2023":{"crop":"CC WW","total_bu":6621.7,"bu_per_ac":24.23},"2024":{"crop":"Lentils","revenue":52248.61,"total_bu":9586.9,"sold_price":5.45,"bu_per_ac":35.09},"2025":{"crop":"CC WW","total_bu":5620.0,"bu_per_ac":20.57}},
  "Lynch 40|32-29N-3E":{"2019":{"crop":"Chickpeas","revenue":6750.0,"total_bu":750.0,"sold_price":9.0,"bu_per_ac":17.06},"2020":{"crop":"Spring Wheat","revenue":7006.65,"total_bu":1401.3,"sold_price":5.0,"bu_per_ac":31.88},"2021":{"crop":"Green Peas","total_bu":216.7,"bu_per_ac":4.93},"2022":{"crop":"CC WW","total_bu":209.7,"bu_per_ac":4.77},"2023":{"crop":"Chickpeas","total_bu":274.4,"bu_per_ac":6.24},"2024":{"crop":"CC WW","revenue":7305.0,"total_bu":1461.0,"sold_price":5.0,"bu_per_ac":33.23},"2025":{"crop":"Mustard","total_bu":311.0,"bu_per_ac":7.07}},
  "East 320|33-29N-3E":{"2019":{"crop":"Chickpeas","revenue":55800.0,"total_bu":6200.0,"sold_price":9.0,"bu_per_ac":19.48},"2020":{"crop":"Spring Wheat","revenue":51875.05,"total_bu":10375.0,"sold_price":5.0,"bu_per_ac":32.6},"2021":{"crop":"Green Peas","total_bu":1569.1,"bu_per_ac":4.93},"2022":{"crop":"CC WW","total_bu":1000.0,"bu_per_ac":3.14},"2023":{"crop":"Chickpeas","total_bu":5974.4,"bu_per_ac":18.77},"2024":{"crop":"CC WW","revenue":52582.69,"total_bu":9648.2,"sold_price":5.45,"bu_per_ac":30.31},"2025":{"crop":"Mustard","total_bu":2684.0,"bu_per_ac":8.43}},
  "Home Place|12-29N-3E":{"2019":{"crop":"Spring Wheat","revenue":126117.0,"total_bu":14013.0,"sold_price":9.0,"bu_per_ac":56.09},"2020":{"crop":"Flax","revenue":58298.5,"total_bu":11659.7,"sold_price":5.0,"bu_per_ac":46.67},"2021":{"crop":"Spring Wheat","total_bu":3259.9,"bu_per_ac":13.05},"2022":{"crop":"Chickpeas","total_bu":1898.5,"bu_per_ac":7.6},"2023":{"crop":"CC WW","total_bu":3346.9,"bu_per_ac":13.4},"2024":{"crop":"Green Peas","revenue":30174.01,"total_bu":5211.4,"sold_price":5.79,"bu_per_ac":20.86},"2025":{"crop":"Barley","total_bu":7113.0,"bu_per_ac":28.47}},
  "South House Section|14-29N-3E":{"2019":{"crop":"Spring Wheat","revenue":231149.7,"total_bu":25683.3,"sold_price":9.0,"bu_per_ac":79.64},"2020":{"crop":"Chickpeas","revenue":113198.5,"total_bu":22639.7,"sold_price":5.0,"bu_per_ac":70.2},"2021":{"crop":"Spring Wheat","total_bu":11201.7,"bu_per_ac":34.73},"2022":{"crop":"Austrians","total_bu":17.4,"bu_per_ac":0.06},"2023":{"crop":"CC WW","total_bu":14404.6,"bu_per_ac":43.41},"2024":{"crop":"Chickpeas","revenue":60768.59,"total_bu":11150.2,"sold_price":5.45,"bu_per_ac":33.6},"2025":{"crop":"CC HAD","total_bu":9904.8,"bu_per_ac":29.85}},
  "North Kirby|3-29N-3E":{"2019":{"crop":"Spring Wheat","revenue":31333.5,"total_bu":5697.0,"sold_price":5.5,"bu_per_ac":36.66},"2020":{"crop":"Austrians","revenue":18337.2,"total_bu":2292.2,"sold_price":8.0,"bu_per_ac":14.75},"2021":{"crop":"Spring Wheat","total_bu":2175.6,"bu_per_ac":14.0},"2022":{"crop":"Chickpeas","total_bu":1300.0,"bu_per_ac":8.37},"2023":{"crop":"CC WW","total_bu":2506.6,"bu_per_ac":16.13},"2024":{"crop":"Green Peas","revenue":9900.0,"total_bu":1100.0,"sold_price":9.0,"bu_per_ac":7.08},"2025":{"crop":"CC HAD","total_bu":3045.0,"bu_per_ac":19.59}},
  "west kirby|3-29N-3E":{"2019":{"crop":"Spring Wheat","revenue":15950.0,"total_bu":2900.0,"sold_price":5.5,"bu_per_ac":48.91},"2020":{"crop":"Austrians","revenue":8931.2,"total_bu":1116.4,"sold_price":8.0,"bu_per_ac":18.83},"2021":{"crop":"Spring Wheat","total_bu":1059.7,"bu_per_ac":17.87},"2022":{"crop":"Chickpeas","total_bu":622.0,"bu_per_ac":10.49},"2023":{"crop":"CC WW","total_bu":1220.1,"bu_per_ac":20.58},"2024":{"crop":"Green Peas","revenue":4989.6,"total_bu":554.4,"sold_price":9.0,"bu_per_ac":9.35},"2025":{"crop":"CC HAD","total_bu":1483.0,"bu_per_ac":25.01}},
  "west buildings state|33-30N-3E":{"2019":{"crop":"Spring Wheat","revenue":25176.25,"total_bu":4577.5,"sold_price":5.5,"bu_per_ac":76.69},"2020":{"crop":"Chickpeas","revenue":46366.8,"total_bu":3863.9,"sold_price":12.0,"bu_per_ac":64.73},"2021":{"crop":"Spring Wheat","total_bu":1322.2,"bu_per_ac":22.15},"2022":{"crop":"Green Peas","total_bu":301.1,"bu_per_ac":5.04},"2023":{"crop":"CC WW","total_bu":3316.3,"bu_per_ac":55.56},"2024":{"crop":"Chickpeas","revenue":13978.0,"total_bu":698.9,"sold_price":20.0,"bu_per_ac":11.71},"2025":{"crop":"CC HAD","total_bu":1760.0,"bu_per_ac":29.49}},
  "south state 320|4-29N-3E":{"2019":{"crop":"Spring Wheat","revenue":39787.0,"total_bu":7234.0,"sold_price":5.5,"bu_per_ac":46.84},"2020":{"crop":"Chickpeas","revenue":50916.0,"total_bu":4243.0,"sold_price":12.0,"bu_per_ac":27.47},"2021":{"crop":"Spring Wheat","total_bu":5519.6,"bu_per_ac":34.77},"2022":{"crop":"Green Peas","total_bu":1600.3,"bu_per_ac":10.08},"2023":{"crop":"CC WW","total_bu":7149.8,"bu_per_ac":45.04},"2024":{"crop":"Chickpeas","revenue":15857.85,"total_bu":2806.7,"sold_price":5.65,"bu_per_ac":17.68},"2025":{"crop":"CC HAD","total_bu":3744.0,"bu_per_ac":23.58}},
  "south state 321|4-29N-3E":{"2019":{"crop":"Austrians","revenue":8613.0,"total_bu":957.0,"sold_price":9.0,"bu_per_ac":6.03},"2020":{"crop":"Spring Wheat","revenue":32045.7,"total_bu":6409.1,"sold_price":5.0,"bu_per_ac":40.37}},
  "north rock hill|32-30N-3E":{"2019":{"crop":"Spring Wheat","revenue":7650.0,"total_bu":850.0,"sold_price":9.0,"bu_per_ac":29.45},"2020":{"crop":"Austrians","revenue":7726.0,"total_bu":1545.2,"sold_price":5.0,"bu_per_ac":53.54},"2021":{"crop":"Spring Wheat","total_bu":291.3,"bu_per_ac":10.09},"2022":{"crop":"Chickpeas","total_bu":262.8,"bu_per_ac":9.11},"2023":{"crop":"CC WW","total_bu":611.0,"bu_per_ac":21.17},"2024":{"crop":"Green Peas","revenue":6147.2,"total_bu":1088.0,"sold_price":5.65,"bu_per_ac":37.7},"2025":{"crop":"CC WW","total_bu":374.0,"bu_per_ac":12.96}},
  "winter wheat|":{"2020":{"crop":"CC WW","revenue":120892.95,"total_bu":26865.1,"sold_price":4.5,"bu_per_ac":55.69}},
  "SW 320|25-31N-7E":{"2021":{"crop":"Winter Wheat","total_bu":3238.2,"bu_per_ac":23.0},"2022":{"crop":"Yellow Peas","total_bu":700.0,"bu_per_ac":4.97},"2023":{"crop":"Spring Wheat","total_bu":8700.1,"bu_per_ac":61.79}},
  "NW 320|24-31N-7E":{"2021":{"crop":"Winter Wheat","total_bu":3455.5,"bu_per_ac":23.0},"2022":{"crop":"Yellow Peas","total_bu":843.9,"bu_per_ac":5.62},"2023":{"crop":"Chickpeas","total_bu":3760.0,"bu_per_ac":25.03}},
  "NE 320|24-31N-7E":{"2021":{"crop":"Winter Wheat","total_bu":3796.2,"bu_per_ac":23.0},"2022":{"crop":"Yellow Peas","total_bu":900.0,"bu_per_ac":5.45},"2023":{"crop":"Chickpeas","total_bu":4223.9,"bu_per_ac":25.59}},
  "SE 320|25-31N-7E":{"2021":{"crop":"Winter Wheat","total_bu":3626.2,"bu_per_ac":23.0},"2022":{"crop":"Yellow Peas","total_bu":723.6,"bu_per_ac":4.59},"2023":{"crop":"Spring Wheat","total_bu":9394.0,"bu_per_ac":59.58}},
  "West Joplin Road|35-31N-7E":{"2021":{"crop":"Winter Wheat","total_bu":2532.6,"bu_per_ac":16.0},"2022":{"crop":"CC WW","total_bu":394.8,"bu_per_ac":2.49},"2023":{"crop":"Chickpeas","total_bu":4489.2,"bu_per_ac":28.36},"2024":{"crop":"Spring Wheat","revenue":28932.05,"total_bu":4996.9,"sold_price":5.79,"bu_per_ac":31.57},"2025":{"crop":"Mustard","total_bu":1854.0,"bu_per_ac":11.71}},
  "Beulow Rd|18-31N-7E":{"2021":{"crop":"Chickpeas","total_bu":504.1,"bu_per_ac":3.12},"2022":{"crop":"Spring Wheat","total_bu":863.2,"bu_per_ac":5.34},"2023":{"crop":"Lentils","total_bu":693.4,"bu_per_ac":4.29},"2024":{"crop":"Spring Wheat","revenue":9619.51,"total_bu":1661.4,"sold_price":5.79,"bu_per_ac":10.28},"2025":{"crop":"Chickpeas","total_bu":1023.0,"bu_per_ac":6.33}},
  "Beulow Rd|17-31N-7E":{"2021":{"crop":"Chickpeas","total_bu":1456.9,"bu_per_ac":3.01},"2022":{"crop":"Spring Wheat","total_bu":2118.3,"bu_per_ac":4.38},"2023":{"crop":"Lentils","total_bu":3150.6,"bu_per_ac":6.51},"2024":{"crop":"Spring Wheat","revenue":29869.45,"total_bu":5158.8,"sold_price":5.79,"bu_per_ac":10.66},"2025":{"crop":"Chickpeas","total_bu":3098.0,"bu_per_ac":6.4}},
  "East 320|25-31N-5E":{"2023":{"crop":"Spring Wheat","total_bu":9480.1,"bu_per_ac":30.28},"2024":{"crop":"Austrians","revenue":69080.85,"total_bu":5117.1,"sold_price":13.5,"bu_per_ac":16.34}},
  "North 320|23-31N-5E":{"2023":{"crop":"Mustard","total_bu":2684.7,"bu_per_ac":8.37},"2024":{"crop":"Lentils","revenue":39122.88,"total_bu":1422.7,"sold_price":27.5,"bu_per_ac":4.44}},
  "Middle section|26-31N-5E":{"2023":{"crop":"Spring Wheat","total_bu":20567.2,"bu_per_ac":32.26},"2024":{"crop":"Lentils","revenue":105217.75,"total_bu":3826.1,"sold_price":27.5,"bu_per_ac":6.0}},
  "West 280|27-31N-5E":{"2023":{"crop":"Spring Wheat","total_bu":45.5,"bu_per_ac":0.16},"2024":{"crop":"Chickpeas","revenue":34262.0,"total_bu":1713.1,"sold_price":20.0,"bu_per_ac":6.15}},
  "Watson West|12/13-29N-3E":{"2024":{"crop":"Winter Wheat","revenue":363840.0,"total_bu":18192.0,"sold_price":20.0,"bu_per_ac":83.29},"2025":{"crop":"Chickpeas","total_bu":6679.0,"bu_per_ac":30.58}},
  "Watson NorthWest|12-29N-3E":{"2024":{"crop":"Winter Wheat","revenue":11694.61,"total_bu":2145.8,"sold_price":5.45,"bu_per_ac":53.25},"2025":{"crop":"Chickpeas","total_bu":524.0,"bu_per_ac":13.0}},
  "Watson North|7-29N-4E":{"2024":{"crop":"Chickpeas","revenue":111380.56,"total_bu":20436.8,"sold_price":5.45,"bu_per_ac":65.06},"2025":{"crop":"CC HAD","total_bu":9368.0,"bu_per_ac":29.82}},
  "Watson South|18-29N-4E":{"2024":{"crop":"Chickpeas","revenue":55977.5,"total_bu":10271.1,"sold_price":5.45,"bu_per_ac":65.27},"2025":{"crop":"CC HAD","total_bu":3906.0,"bu_per_ac":24.82}},
  "Watson SouthEast|17-29N-4E":{"2024":{"crop":"Chickpeas","revenue":24460.69,"total_bu":4488.2,"sold_price":5.45,"bu_per_ac":53.73},"2025":{"crop":"CC HAD","total_bu":2062.8,"bu_per_ac":24.7}},
  "Cedric Section 6|6-29N-4E":{"2024":{"crop":"Winter Wheat","revenue":88846.39,"total_bu":15344.8,"sold_price":5.79,"bu_per_ac":100.15},"2025":{"crop":"Chickpeas","total_bu":8066.0,"bu_per_ac":52.64}},
  "STATE north|06-30N-7E":{"2025":{"crop":"Spring Wheat","total_bu":3561.0,"bu_per_ac":16.09}},
  "Akey yard W|07-30N-6E":{"2025":{"crop":"CC WW","total_bu":3316.0,"bu_per_ac":21.0}},
  "Akey yard E|08-30N-6E":{"2025":{"crop":"CC WW","total_bu":2862.0,"bu_per_ac":21.0}},
  "Akey Yard|08-30N-6E":{"2025":{"crop":"CC WW","total_bu":248.0,"bu_per_ac":20.96}},
  "East 320|":{"2025":{"crop":"Spring Wheat","total_bu":6343.0,"bu_per_ac":20.26}},
  "North 320|":{"2025":{"crop":"Chickpeas","total_bu":2608.0,"bu_per_ac":8.13}},
  "Middle section|":{"2025":{"crop":"Chickpeas","total_bu":3338.0,"bu_per_ac":5.24}},
  "West 280|":{"2025":{"crop":"Spring Wheat","total_bu":7700.0,"bu_per_ac":27.65}},
};

function getCropProfitability(crop, acres, fieldCommon) {
  // ── Expense calculation ──────────────────────────────────────────────────
  const expRate = EXP.reduce((s,[k]) => {
    const rates = _expRates||DEFAULT_RATES;
    const crops = _cropRates||CROP_EXP_DEFAULTS;
    const cd = crops[crop];
    return s + (cd&&cd[k]!==undefined ? cd[k] : rates[k]??0);
  }, 0);
  const expenses = expRate * acres;

  // ── APH yield lookup — priority: imported APH > manual history > FA/VT hardcoded ──
  let aphYield=null, aphYears=null, aphNote=null;

  // 1. Imported APH (from crop insurance PDF)
  if(_aphData && fieldCommon && _aphData[fieldCommon]?.[crop]?.aphYield) {
    const d = _aphData[fieldCommon][crop];
    aphYield = d.aphYield;
    aphYears = d.aphYears;
    aphNote  = `${aphYield} bu/ac APH (${aphYears||"?"}yr) — imported`;
  }

  // 2. Manual history — average yield for this crop across entered years
  if(!aphYield && _fieldHistory?.[fieldCommon]) {
    const yrs = Object.values(_fieldHistory[fieldCommon])
      .filter(y => y.crop===crop && y.yield && +y.yield>0);
    if(yrs.length>0){
      aphYield = Math.round(yrs.reduce((s,y)=>s+(+y.yield),0)/yrs.length*10)/10;
      aphYears = yrs.length;
      aphNote  = `${aphYield} bu/ac avg (${aphYears}yr manual history)`;
    }
  }

  // 3. FA/VT hardcoded data (standalone app only)
  if(!aphYield && !_isAgriLogixTenant) {
    const fa = FIELD_APH[fieldCommon]?.[crop] || FIELD_APH[fieldCommon+"|"]?.[crop];
    const t  = CROP_TYPICAL[crop];
    if(fa){ aphYield=fa.aph; aphYears=fa.n; aphNote=`${fa.aph} bu/ac APH (${fa.n}yr)`; }
    else if(t){ aphYield=t.buProj; aphNote="Typical (no field APH)"; }
  }

  // No APH — return expense-only result so UI can show expenses without revenue
  if(!aphYield) {
    if(expRate===0) return null;
    return {
      expRate, expenses,
      buGuar:null, priceGuar:null,
      aphNote: "No APH data — add in History & Plan tab",
      guarRevPerAc:null, guarRev:null, guarNet:null, guarNetPerAc:null,
      projRevPerAc:null, projRev:null, projNet:null, projNetPerAc:null,
      soldPrice:null, fieldAph:false,
    };
  }

  // ── Revenue calculation ──────────────────────────────────────────────────
  const t = CROP_TYPICAL[crop];
  const buGuar    = Math.round(aphYield*0.75*10)/10;
  // Use tenant-configured prices first, fall back to CROP_TYPICAL defaults
  const tp        = _cropPrices?.[crop];
  const priceGuar = tp?.priceGuar>0 ? tp.priceGuar : (t?.priceGuar || 0);
  const soldPrice = tp?.projPrice>0 ? tp.projPrice :
                    ((typeof CROP_SOLD_PRICES!=="undefined"&&CROP_SOLD_PRICES[crop]) || t?.projPrice || 0);

  const guarRevPerAc = buGuar*priceGuar;
  const guarRev      = guarRevPerAc*acres;
  const projRevPerAc = aphYield*soldPrice;
  const projRev      = projRevPerAc*acres;

  return {
    expRate, expenses,
    buGuar, priceGuar, aphNote,
    guarRevPerAc, guarRev, guarNet:guarRev-expenses, guarNetPerAc:guarRevPerAc-expRate,
    projRevPerAc, projRev, projNet:projRev-expenses, projNetPerAc:projRevPerAc-expRate,
    soldPrice, fieldAph:true,
  };
}


let _id=1;
const FA_ELIG=["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"];
const VT_ELIG=["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax"];

function getRate(field,key){
  if(field.expenseOverrides&&field.expenseOverrides[key]!==undefined) return +field.expenseOverrides[key];
  const rates=_expRates||DEFAULT_RATES; const crops=_cropRates||CROP_EXP_DEFAULTS;
  const cd=crops[field.crop];
  if(cd&&cd[key]!==undefined) return cd[key];
  return (_isAgriLogixTenant ? (rates[key]??0) : (rates[key]??DEFAULT_RATES[key]??0));
}
function getCropDefault(crop,key){
  const rates=_expRates||DEFAULT_RATES; const crops=_cropRates||CROP_EXP_DEFAULTS;
  const cd=crops[crop];
  return cd&&cd[key]!==undefined?cd[key]:rates[key]??0;
}
function calc(field){
  if(!field||typeof field!=="object"||!field.income){ return {valAcre:0,guarantee:0,revenue:0,risk:0,expRate:0,expenses:0,net:0}; }
  const{acres,income:i}=field;
  const valAcre=i.bushelGuarantee*i.priceGuarantee;
  const guarantee=valAcre*acres;
  const revenue=i.bushelProjection*i.currentPrice*acres;
  const expRate=EXP.reduce((s,[k])=>s+getRate(field,k),0);
  const expenses=expRate*acres;
  return{valAcre,guarantee,revenue,risk:revenue-guarantee,expRate,expenses,net:revenue-expenses};
}
const f$=(n,neg)=>{const abs=Math.abs(n);const str="$"+abs.toLocaleString("en-US",{maximumFractionDigits:0});return neg&&n<0?"("+str+")":str;};
const f2=n=>(+n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});

function mkF(farmNum,entity,farm,legal,common,fieldNum,acres,crop,bG,pG,bP,cP,el){
  return{id:String(_id++),farmNumber:farmNum,entity,farm,legal:legal||"",common,fieldNum:fieldNum||"",
    acres:+acres,crop,eligibleCrops:el||(_isAgriLogixTenant?[...(_tenantCrops||ALL_CROPS)]:FA_ELIG),
    income:{bushelGuarantee:+bG,priceGuarantee:+pG,bushelProjection:+bP,currentPrice:+cP},
    expenseOverrides:{}};
}

const INITIAL_FIELDS = [
  {id:String(_id++),farmNumber:355,excelRow:5,entity:"Flat Acre",farm:"Home",legal:"",common:"North Tiber Grade",fieldNum:"1,2,3",acres:314.79,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:19.5,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:355,excelRow:6,entity:"Flat Acre",farm:"Home",legal:"",common:"North Wanken",fieldNum:"1",acres:317.98,crop:"Flax",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:12.0,priceGuarantee:20.0,bushelProjection:15.0,currentPrice:20.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:355,excelRow:7,entity:"Flat Acre",farm:"Home",legal:"",common:"West 50s",fieldNum:"1,2,3,4,5,6",acres:315.47,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:16.4,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:355,excelRow:8,entity:"Flat Acre",farm:"Home",legal:"",common:"West 120\'s",fieldNum:"1",acres:116.77,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:14.45,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:355,excelRow:9,entity:"Flat Acre",farm:"Home",legal:"",common:"West 120\'s",fieldNum:"2,3",acres:239.24,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:14.45,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:355,excelRow:10,entity:"Flat Acre",farm:"Home",legal:"",common:"West 120\'s",fieldNum:"4",acres:122.87,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:14.45,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:355,excelRow:11,entity:"Flat Acre",farm:"Home",legal:"",common:"South House",fieldNum:"1,2",acres:38.67,crop:"Oats",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:35.0,priceGuarantee:3.3,bushelProjection:50.0,currentPrice:3.5},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:355,excelRow:12,entity:"Flat Acre",farm:"Home",legal:"",common:"South House",fieldNum:"1,2",acres:205.52,crop:"Oats",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:35.0,priceGuarantee:3.3,bushelProjection:50.0,currentPrice:3.5},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:355,excelRow:13,entity:"Flat Acre",farm:"Home",legal:"",common:"South House",fieldNum:"3,4,5",acres:233.95,crop:"Oats",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:35.0,priceGuarantee:3.3,bushelProjection:50.0,currentPrice:3.5},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:355,excelRow:14,entity:"Flat Acre",farm:"Home",legal:"",common:"South Poles",fieldNum:"6",acres:156.62,crop:"Oats",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:35.0,priceGuarantee:3.3,bushelProjection:50.0,currentPrice:3.5},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:355,excelRow:15,entity:"Flat Acre",farm:"Home",legal:"",common:"House",fieldNum:"1",acres:10.14,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:18.3,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:355,excelRow:16,entity:"Flat Acre",farm:"Home",legal:"",common:"House",fieldNum:"2",acres:13.27,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:18.3,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:355,excelRow:17,entity:"Flat Acre",farm:"Home",legal:"",common:"House",fieldNum:"1",acres:163.56,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:18.3,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:355,excelRow:18,entity:"Flat Acre",farm:"Home",legal:"",common:"House",fieldNum:"2",acres:155.26,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:18.3,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:355,excelRow:19,entity:"Flat Acre",farm:"Home",legal:"",common:"House",fieldNum:"3",acres:73.52,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:18.3,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:355,excelRow:20,entity:"Flat Acre",farm:"Home",legal:"",common:"House",fieldNum:"4",acres:86.3,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:18.3,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:355,excelRow:21,entity:"Flat Acre",farm:"Home",legal:"",common:"House",fieldNum:"4",acres:120.0,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:18.3,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:355,excelRow:22,entity:"Flat Acre",farm:"Home",legal:"",common:"North Hendrickson",fieldNum:"1,2",acres:159.42,crop:"CC HAD",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:21.0,priceGuarantee:6.98,bushelProjection:20.0,currentPrice:7.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:355,excelRow:23,entity:"Flat Acre",farm:"Home",legal:"",common:"North Hendrickson",fieldNum:"1,3",acres:160.49,crop:"CC HAD",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:21.0,priceGuarantee:6.98,bushelProjection:20.0,currentPrice:7.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3605,excelRow:24,entity:"Flat Acre",farm:"Hunnewell",legal:"",common:"North Henke",fieldNum:"1,2",acres:322.55,crop:"Mustard",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:9.0,priceGuarantee:20.0,bushelProjection:11.0,currentPrice:20.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3605,excelRow:25,entity:"Flat Acre",farm:"Hunnewell",legal:"",common:"North Henke",fieldNum:"1,2",acres:15.04,crop:"Mustard",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:9.0,priceGuarantee:20.0,bushelProjection:11.0,currentPrice:20.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3605,excelRow:26,entity:"Flat Acre",farm:"Hunnewell",legal:"",common:"North Kammer",fieldNum:"1",acres:318.11,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:14.0,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3605,excelRow:27,entity:"Flat Acre",farm:"Hunnewell",legal:"",common:"Henke/Hill",fieldNum:"1,3,4",acres:105.62,crop:"Mustard",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:9.0,priceGuarantee:20.0,bushelProjection:11.0,currentPrice:20.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3605,excelRow:28,entity:"Flat Acre",farm:"Hunnewell",legal:"",common:"Henke/Hill",fieldNum:"1,3,4",acres:15.08,crop:"Mustard",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:9.0,priceGuarantee:20.0,bushelProjection:11.0,currentPrice:20.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2694,excelRow:29,entity:"Flat Acre",farm:"Ray",legal:"",common:"Blow Field",fieldNum:"1",acres:159.37,crop:"Quinoa",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:0.0,priceGuarantee:7.0,bushelProjection:20.0,currentPrice:30.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2694,excelRow:30,entity:"Flat Acre",farm:"Ray",legal:"",common:"West CRP",fieldNum:"1,2,3,4",acres:206.06,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:18.0,priceGuarantee:6.19,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2694,excelRow:31,entity:"Flat Acre",farm:"Ray",legal:"",common:"East Trues",fieldNum:"1,3",acres:245.34,crop:"Lentils",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:13.3,priceGuarantee:9.0,bushelProjection:13.0,currentPrice:12.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2694,excelRow:32,entity:"Flat Acre",farm:"Ray",legal:"",common:"East Trues",fieldNum:"2",acres:73.64,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:26.0,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2694,excelRow:33,entity:"Flat Acre",farm:"Ray",legal:"",common:"East Trues",fieldNum:"4",acres:159.62,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:26.0,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2694,excelRow:34,entity:"Flat Acre",farm:"Ray",legal:"",common:"North Cabin",fieldNum:"1,2,3,4,5",acres:315.25,crop:"CC HAD",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:24.0,priceGuarantee:7.0,bushelProjection:20.0,currentPrice:7.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2694,excelRow:35,entity:"Flat Acre",farm:"Ray",legal:"",common:"Trues",fieldNum:"1,3,4",acres:62.0,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:17.0,priceGuarantee:13.0,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2694,excelRow:36,entity:"Flat Acre",farm:"Ray",legal:"",common:"Trues",fieldNum:"1",acres:191.27,crop:"Mustard",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:9.0,priceGuarantee:20.0,bushelProjection:11.0,currentPrice:20.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2694,excelRow:37,entity:"Flat Acre",farm:"Ray",legal:"",common:"Trues",fieldNum:"3,4",acres:97.0,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:17.0,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2694,excelRow:38,entity:"Flat Acre",farm:"Ray",legal:"",common:"Trues",fieldNum:"2",acres:117.1,crop:"Mustard",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:9.0,priceGuarantee:20.0,bushelProjection:11.0,currentPrice:20.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2694,excelRow:39,entity:"Flat Acre",farm:"Ray",legal:"",common:"West Trues",fieldNum:"1",acres:44.27,crop:"Mustard",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:9.0,priceGuarantee:20.0,bushelProjection:11.0,currentPrice:20.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2694,excelRow:40,entity:"Flat Acre",farm:"Ray",legal:"",common:"West Trues",fieldNum:"2",acres:38.42,crop:"Mustard",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:9.0,priceGuarantee:20.0,bushelProjection:11.0,currentPrice:20.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2694,excelRow:41,entity:"Flat Acre",farm:"Ray",legal:"",common:"Pivot CRP",fieldNum:"1",acres:24.89,crop:"Cover Crop",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:15.0,priceGuarantee:6.0,bushelProjection:50.0,currentPrice:2.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2694,excelRow:42,entity:"Flat Acre",farm:"Ray",legal:"",common:"Pivot",fieldNum:"2",acres:69.96,crop:"Cover Crop",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:45.0,priceGuarantee:6.0,bushelProjection:50.0,currentPrice:2.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2694,excelRow:43,entity:"Flat Acre",farm:"Ray",legal:"",common:"Barn",fieldNum:"1,2,3,4,5,6",acres:159.38,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:15.0,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2694,excelRow:44,entity:"Flat Acre",farm:"Ray",legal:"",common:"island",fieldNum:"1",acres:8.9,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:19.0,priceGuarantee:6.19,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2694,excelRow:45,entity:"Flat Acre",farm:"Ray",legal:"",common:"Cabin East",fieldNum:"1,5",acres:38.06,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:15.0,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2694,excelRow:46,entity:"Flat Acre",farm:"Ray",legal:"",common:"Cabin East",fieldNum:"2,3,4",acres:146.98,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:15.0,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2892,excelRow:47,entity:"Flat Acre",farm:"Ray",legal:"",common:"STATE",fieldNum:"1,2,3,4,5,6",acres:72.24,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:15.0,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2693,excelRow:48,entity:"Flat Acre",farm:"Ray",legal:"",common:"BOR",fieldNum:"1,1,2",acres:32.65,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:19.0,priceGuarantee:6.19,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2892,excelRow:49,entity:"Flat Acre",farm:"Brown",legal:"",common:"STATE north",fieldNum:"1,2",acres:221.26,crop:"Mustard",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:9.0,priceGuarantee:20.0,bushelProjection:11.0,currentPrice:20.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2892,excelRow:50,entity:"Flat Acre",farm:"Brown",legal:"",common:"STATE",fieldNum:"1,2",acres:72.99,crop:"Mustard",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:9.0,priceGuarantee:20.0,bushelProjection:11.0,currentPrice:20.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3605,excelRow:51,entity:"Flat Acre",farm:"Brown",legal:"",common:"North Rd",fieldNum:"1,2,1,2,3,1-3",acres:383.18,crop:"Mustard",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:9.0,priceGuarantee:20.0,bushelProjection:11.0,currentPrice:20.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3605,excelRow:52,entity:"Flat Acre",farm:"Brown",legal:"",common:"South Rd.",fieldNum:"1-2,1-4",acres:287.43,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:21.0,priceGuarantee:6.19,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3346,excelRow:53,entity:"Flat Acre",farm:"Nuxoll Land",legal:"",common:"Akey yard W",fieldNum:"1",acres:157.92,crop:"Quinoa",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:0,priceGuarantee:0,bushelProjection:20.0,currentPrice:30.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3346,excelRow:54,entity:"Flat Acre",farm:"Nuxoll Land",legal:"",common:"Akey yard E",fieldNum:"2",acres:136.29,crop:"Austrians",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:15.0,priceGuarantee:14.4,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3605,excelRow:55,entity:"Flat Acre",farm:"Nuxoll Land",legal:"",common:"Akey Yard",fieldNum:"1,2",acres:11.83,crop:"Austrians",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:15.0,priceGuarantee:14.4,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3009,excelRow:56,entity:"Flat Acre",farm:"Englund",legal:"",common:"N. 320",fieldNum:"1,3",acres:214.0,crop:"Austrians",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:17.0,priceGuarantee:14.4,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3009,excelRow:57,entity:"Flat Acre",farm:"Englund",legal:"",common:"N. 320",fieldNum:"2",acres:105.0,crop:"Austrians",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:17.0,priceGuarantee:14.4,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3009,excelRow:58,entity:"Flat Acre",farm:"Englund",legal:"",common:"East Section",fieldNum:"2",acres:111.14,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:19.5,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3009,excelRow:59,entity:"Flat Acre",farm:"Englund",legal:"",common:"East Section",fieldNum:"4",acres:66.56,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:19.5,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3009,excelRow:60,entity:"Flat Acre",farm:"Englund",legal:"",common:"East Section",fieldNum:"1,3,5",acres:463.45,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:19.5,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3009,excelRow:61,entity:"Flat Acre",farm:"Englund",legal:"",common:"House",fieldNum:"1,2,17",acres:38.25,crop:"CC HAD",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:21.0,priceGuarantee:7.0,bushelProjection:20.0,currentPrice:7.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3009,excelRow:62,entity:"Flat Acre",farm:"Englund",legal:"",common:"House",fieldNum:"2,4-16",acres:565.69,crop:"CC HAD",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:21.0,priceGuarantee:7.0,bushelProjection:20.0,currentPrice:7.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3009,excelRow:63,entity:"Flat Acre",farm:"Englund",legal:"",common:"West Section",fieldNum:"4,5,6",acres:165.4,crop:"CC HAD",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:21.0,priceGuarantee:7.0,bushelProjection:20.0,currentPrice:7.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3009,excelRow:64,entity:"Flat Acre",farm:"Englund",legal:"",common:"West Section",fieldNum:"1,10",acres:81.61,crop:"CC HAD",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:21.0,priceGuarantee:7.0,bushelProjection:20.0,currentPrice:7.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3009,excelRow:65,entity:"Flat Acre",farm:"Englund",legal:"",common:"West Section",fieldNum:"2,3,4,6,7,8",acres:221.43,crop:"CC HAD",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:21.0,priceGuarantee:7.0,bushelProjection:20.0,currentPrice:7.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3009,excelRow:66,entity:"Flat Acre",farm:"Englund",legal:"",common:"West Section",fieldNum:"9",acres:63.55,crop:"CC HAD",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:21.0,priceGuarantee:7.0,bushelProjection:20.0,currentPrice:7.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3009,excelRow:67,entity:"Flat Acre",farm:"Englund",legal:"",common:"West Section",fieldNum:"2,3,7,8",acres:91.0,crop:"CC HAD",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:21.0,priceGuarantee:7.0,bushelProjection:20.0,currentPrice:7.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3009,excelRow:68,entity:"Flat Acre",farm:"Englund",legal:"",common:"West Section",fieldNum:"11",acres:9.76,crop:"CC HAD",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:21.0,priceGuarantee:7.0,bushelProjection:20.0,currentPrice:7.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3591,excelRow:69,entity:"Flat Acre",farm:"Chris Kolstad",legal:"",common:"Watson West",fieldNum:"1,6",acres:395.12,crop:"CC HAD",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:37.0,priceGuarantee:6.98,bushelProjection:20.0,currentPrice:7.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3591,excelRow:70,entity:"Flat Acre",farm:"Chris Kolstad",legal:"",common:"Watson West",fieldNum:"2,3,4,5",acres:218.43,crop:"CC HAD",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:37.0,priceGuarantee:6.98,bushelProjection:20.0,currentPrice:7.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3591,excelRow:71,entity:"Flat Acre",farm:"Chris Kolstad",legal:"",common:"Watson NorthWest",fieldNum:"1",acres:40.3,crop:"CC HAD",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:37.0,priceGuarantee:7.0,bushelProjection:20.0,currentPrice:7.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2644,excelRow:72,entity:"Flat Acre",farm:"Duncan",legal:"",common:"Block",fieldNum:"",acres:589.0,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:16.5,priceGuarantee:15.0,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:73,entity:"Flat Acre",farm:"Duncan",legal:"",common:"east of block",fieldNum:"",acres:320.0,crop:"Chickpeas",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:16.5,priceGuarantee:15.0,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:74,entity:"Flat Acre",farm:"Duncan",legal:"",common:"Duncan",fieldNum:"",acres:550.0,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:22.0,priceGuarantee:6.19,bushelProjection:22.0,currentPrice:6.19},expenseOverrides:{}},
  {id:String(_id++),farmNumber:null,excelRow:75,entity:"Flat Acre",farm:"Kolstad Lake",legal:"",common:"Kolstad Lake",fieldNum:"",acres:640.0,crop:"Chem-Fallow",eligibleCrops:["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"],income:{bushelGuarantee:0,priceGuarantee:0,bushelProjection:0.0,currentPrice:0.0},expenseOverrides:{}},
  {id:String(_id++),farmNumber:null,excelRow:77,entity:"Via Terra",farm:"Chris Kolstad",legal:"",common:"Watson North",fieldNum:"123",acres:313.84,crop:"Barley",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:37.0,priceGuarantee:4.2,bushelProjection:35.0,currentPrice:4.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:78,entity:"Via Terra",farm:"Chris Kolstad",legal:"",common:"Watson North",fieldNum:"456",acres:314.12,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:22.0,priceGuarantee:6.19,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:79,entity:"Via Terra",farm:"Chris Kolstad",legal:"",common:"Watson South",fieldNum:"123",acres:157.99,crop:"Barley",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:37.0,priceGuarantee:4.2,bushelProjection:35.0,currentPrice:4.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:80,entity:"Via Terra",farm:"Chris Kolstad",legal:"",common:"Watson South",fieldNum:"456",acres:157.36,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:22.0,priceGuarantee:6.19,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:81,entity:"Via Terra",farm:"Chris Kolstad",legal:"",common:"Watson SouthEast",fieldNum:"1",acres:75.29,crop:"Barley",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:37.0,priceGuarantee:4.2,bushelProjection:35.0,currentPrice:4.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:82,entity:"Via Terra",farm:"Chris Kolstad",legal:"",common:"Watson SouthEast",fieldNum:"2",acres:83.53,crop:"Barley",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:37.0,priceGuarantee:4.2,bushelProjection:35.0,currentPrice:4.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:83,entity:"Via Terra",farm:"Kostad Trust",legal:"",common:"Cedric Section 6",fieldNum:"1",acres:155.92,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:24.0,priceGuarantee:6.19,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:84,entity:"Via Terra",farm:"Kostad Trust",legal:"",common:"Cedric Section 6",fieldNum:"2",acres:150.82,crop:"Mustard",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:9.7,priceGuarantee:20.0,bushelProjection:11.0,currentPrice:20.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:85,entity:"Via Terra",farm:"Kostad Trust",legal:"",common:"Cedric Section 6",fieldNum:"3",acres:52.76,crop:"Mustard",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:9.7,priceGuarantee:20.0,bushelProjection:11.0,currentPrice:20.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:86,entity:"Via Terra",farm:"Kostad Trust",legal:"",common:"Cedric Section 6",fieldNum:"5,7",acres:103.26,crop:"Mustard",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:9.7,priceGuarantee:20.0,bushelProjection:11.0,currentPrice:20.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:87,entity:"Via Terra",farm:"Kostad Trust",legal:"",common:"Cedric Section 6",fieldNum:"4,6,8",acres:153.22,crop:"Mustard",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:9.7,priceGuarantee:20.0,bushelProjection:11.0,currentPrice:20.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:88,entity:"Via Terra",farm:"TLU Ranch",legal:"",common:"North Building site",fieldNum:"1 (west 1)",acres:36.3,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:27.0,priceGuarantee:6.19,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:89,entity:"Via Terra",farm:"TLU Ranch",legal:"",common:"West building site",fieldNum:"1 (west 4)",acres:39.3,crop:"Green Peas",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:29.6,priceGuarantee:6.6,bushelProjection:20.0,currentPrice:10.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:90,entity:"Via Terra",farm:"TLU Ranch",legal:"",common:"West building site",fieldNum:"2 (west 3)",acres:41.02,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:27.0,priceGuarantee:6.19,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:91,entity:"Via Terra",farm:"TLU Ranch",legal:"",common:"Rock Hilltop",fieldNum:"1 (west 6)",acres:40.76,crop:"Austrians",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:19.2,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:92,entity:"Via Terra",farm:"TLU Ranch",legal:"",common:"Rock Hilltop",fieldNum:"2 (west 5)",acres:40.66,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:29.0,priceGuarantee:6.19,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:93,entity:"Via Terra",farm:"TLU Ranch",legal:"",common:"west kirby house",fieldNum:"1",acres:156.11,crop:"Chickpeas",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:18.5,priceGuarantee:15.0,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:94,entity:"Via Terra",farm:"TLU Ranch",legal:"",common:"west kirby house",fieldNum:"2",acres:145.4,crop:"Chickpeas",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:18.5,priceGuarantee:15.0,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:95,entity:"Via Terra",farm:"TLU Ranch",legal:"",common:"west Hauser Rd.",fieldNum:"1 (west 2)",acres:154.44,crop:"Green Peas",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:24.0,priceGuarantee:6.6,bushelProjection:20.0,currentPrice:10.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:96,entity:"Via Terra",farm:"TLU Ranch",legal:"",common:"west Hauser Rd.",fieldNum:"2 (west 1)",acres:158.66,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:27.0,priceGuarantee:6.19,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:97,entity:"Via Terra",farm:"TLU Ranch",legal:"",common:"South Rock Hilltop",fieldNum:"1 (west 6)",acres:79.34,crop:"Austrians",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:19.2,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:98,entity:"Via Terra",farm:"TLU Ranch",legal:"",common:"South Rock Hilltop",fieldNum:"2 (west 5)",acres:79.01,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:28.0,priceGuarantee:6.19,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:99,entity:"Via Terra",farm:"danrather (missile)",legal:"",common:"far west north place",fieldNum:"1 (west 6)",acres:237.93,crop:"Austrians",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:19.2,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:100,entity:"Via Terra",farm:"danrather (missile)",legal:"",common:"far west north place",fieldNum:"2 (west 5)",acres:78.77,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:25.0,priceGuarantee:6.19,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:101,entity:"Via Terra",farm:"danrather (missile)",legal:"",common:"Old House West",fieldNum:"1",acres:159.24,crop:"Chickpeas",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:18.0,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:102,entity:"Via Terra",farm:"danrather (missile)",legal:"",common:"South Kirby corner",fieldNum:"1",acres:75.57,crop:"Chickpeas",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:17.5,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:103,entity:"Via Terra",farm:"underdal ent. (home)",legal:"",common:"west home reservoir",fieldNum:"1",acres:64.35,crop:"Green Peas",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:24.0,priceGuarantee:10.0,bushelProjection:20.0,currentPrice:10.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:104,entity:"Via Terra",farm:"danrather (home)",legal:"",common:"N1/2 St. Olaf",fieldNum:"1",acres:78.02,crop:"Lentils",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:16.5,priceGuarantee:9.0,bushelProjection:13.0,currentPrice:12.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:105,entity:"Via Terra",farm:"danrather (home)",legal:"",common:"N1/2 St. Olaf",fieldNum:"2",acres:78.58,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:30.0,priceGuarantee:6.19,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:106,entity:"Via Terra",farm:"TLU Ranch",legal:"",common:"S1/2 St. Olaf",fieldNum:"1",acres:79.26,crop:"Lentils",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:16.5,priceGuarantee:9.0,bushelProjection:13.0,currentPrice:12.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:107,entity:"Via Terra",farm:"TLU Ranch",legal:"",common:"S1/2 St. Olaf",fieldNum:"2",acres:80.92,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:30.0,priceGuarantee:6.19,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:108,entity:"Via Terra",farm:"danrather (stanley)",legal:"",common:"Shotgun Slough",fieldNum:"1",acres:161.11,crop:"Austrians",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:17.0,priceGuarantee:14.4,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:109,entity:"Via Terra",farm:"danrather (stanley)",legal:"",common:"West 200",fieldNum:"1",acres:202.11,crop:"Mustard",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:13.0,priceGuarantee:20.0,bushelProjection:11.0,currentPrice:20.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:110,entity:"Via Terra",farm:"danrather (stanley)",legal:"",common:"South Shotgun",fieldNum:"1",acres:320.85,crop:"Mustard",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:11.5,priceGuarantee:20.0,bushelProjection:11.0,currentPrice:20.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:111,entity:"Via Terra",farm:"danrather (stanley)",legal:"",common:"South Shotgun",fieldNum:"2",acres:273.23,crop:"Austrians",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:15.7,priceGuarantee:14.4,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:112,entity:"Via Terra",farm:"Lynch",legal:"",common:"Lynch 40",fieldNum:"1",acres:43.96,crop:"Austrians",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:15.7,priceGuarantee:14.4,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:113,entity:"Via Terra",farm:"danrather (stanley)",legal:"",common:"East 320",fieldNum:"1",acres:318.28,crop:"Austrians",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:17.0,priceGuarantee:14.4,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:114,entity:"Via Terra",farm:"underdal ent. (home)",legal:"",common:"Home Place",fieldNum:"1",acres:149.87,crop:"Lentils",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:10.5,priceGuarantee:9.0,bushelProjection:13.0,currentPrice:12.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:115,entity:"Via Terra",farm:"underdal ent. (home)",legal:"",common:"Home Place",fieldNum:"2",acres:249.83,crop:"Lentils",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:10.5,priceGuarantee:9.0,bushelProjection:13.0,currentPrice:12.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:116,entity:"Via Terra",farm:"underdal ent. (home)",legal:"",common:"South House Section",fieldNum:"1",acres:306.79,crop:"Green Peas",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:24.0,priceGuarantee:6.6,bushelProjection:20.0,currentPrice:10.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:117,entity:"Via Terra",farm:"underdal ent. (home)",legal:"",common:"South House Section",fieldNum:"2",acres:331.84,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:32.0,priceGuarantee:6.0,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:118,entity:"Via Terra",farm:"danrather (missile)",legal:"",common:"North Kirby",fieldNum:"1",acres:155.4,crop:"Chickpeas",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:18.5,priceGuarantee:15.0,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:119,entity:"Via Terra",farm:"danrather (missile)",legal:"",common:"west kirby",fieldNum:"1",acres:16.4,crop:"Chickpeas",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:18.5,priceGuarantee:15.0,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3533,excelRow:120,entity:"Via Terra",farm:"danrather (missile)",legal:"",common:"west kirby",fieldNum:"2",acres:59.29,crop:"Chickpeas",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:18.5,priceGuarantee:15.0,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2593,excelRow:121,entity:"Via Terra",farm:"state",legal:"",common:"west buildings state",fieldNum:"1 (west 4)",acres:34.43,crop:"Green Peas",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:20.0,priceGuarantee:10.0,bushelProjection:20.0,currentPrice:10.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2593,excelRow:122,entity:"Via Terra",farm:"state",legal:"",common:"west buildings state",fieldNum:"2 (west 3)",acres:36.55,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:27.0,priceGuarantee:6.19,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2593,excelRow:123,entity:"Via Terra",farm:"state",legal:"",common:"west buildings state",fieldNum:"3 (west 2)",acres:59.69,crop:"Green Peas",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:24.0,priceGuarantee:6.6,bushelProjection:20.0,currentPrice:10.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2593,excelRow:124,entity:"Via Terra",farm:"state",legal:"",common:"south state 320",fieldNum:"1 (west 4)",acres:154.45,crop:"Green Peas",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:24.0,priceGuarantee:6.6,bushelProjection:20.0,currentPrice:10.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2593,excelRow:125,entity:"Via Terra",farm:"state",legal:"",common:"south state 320",fieldNum:"2 (west 3)",acres:158.76,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:27.0,priceGuarantee:6.0,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2593,excelRow:126,entity:"Via Terra",farm:"state",legal:"",common:"north rock hill",fieldNum:"1 (west 6)",acres:8.04,crop:"Austrians",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:19.2,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:2593,excelRow:127,entity:"Via Terra",farm:"state",legal:"",common:"north rock hill",fieldNum:"2 (west 5)",acres:28.86,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:26.0,priceGuarantee:6.0,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:128,entity:"Via Terra",farm:"Sharray",legal:"",common:"West Joplin Road",fieldNum:"1",acres:158.84,crop:"Green Peas",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:18.3,priceGuarantee:6.1,bushelProjection:20.0,currentPrice:10.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:129,entity:"Via Terra",farm:"Sharray",legal:"",common:"West Joplin Road",fieldNum:"2",acres:158.29,crop:"Green Peas",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:18.3,priceGuarantee:6.1,bushelProjection:20.0,currentPrice:10.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3345,excelRow:130,entity:"Via Terra",farm:"Beulow Rd",legal:"",common:"Beulow Rd",fieldNum:"4",acres:161.57,crop:"CC HAD",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:21.0,priceGuarantee:7.0,bushelProjection:20.0,currentPrice:7.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:3345,excelRow:131,entity:"Via Terra",farm:"Beulow Rd",legal:"",common:"Beulow Rd",fieldNum:"6",acres:484.02,crop:"CC HAD",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:21.0,priceGuarantee:7.0,bushelProjection:20.0,currentPrice:7.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:132,entity:"Via Terra",farm:"Morkrid",legal:"",common:"East 320",fieldNum:"",acres:313.07,crop:"Mustard",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:9.6,priceGuarantee:20.0,bushelProjection:11.0,currentPrice:20.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:133,entity:"Via Terra",farm:"Morkrid",legal:"",common:"North 320",fieldNum:"",acres:320.75,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:25.0,priceGuarantee:6.19,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:134,entity:"Via Terra",farm:"Morkrid",legal:"",common:"Middle section",fieldNum:"",acres:637.59,crop:"Spring Wheat",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:25.0,priceGuarantee:6.19,bushelProjection:30.0,currentPrice:6.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:135,entity:"Via Terra",farm:"Morkrid",legal:"",common:"West 280",fieldNum:"",acres:278.5,crop:"Mustard",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:9.6,priceGuarantee:20.0,bushelProjection:11.0,currentPrice:20.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:136,entity:"Via Terra",farm:"Lothair",legal:"",common:"north",fieldNum:"",acres:311.9,crop:"Chickpeas",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:17.0,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:137,entity:"Via Terra",farm:"Lothair",legal:"",common:"south eastside",fieldNum:"",acres:155.7,crop:"Barley",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:45.0,priceGuarantee:4.2,bushelProjection:35.0,currentPrice:4.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
  {id:String(_id++),farmNumber:null,excelRow:138,entity:"Via Terra",farm:"Lothair",legal:"",common:"south westside",fieldNum:"",acres:158.2,crop:"Chickpeas",eligibleCrops:["Spring Wheat","CC WW","CC HAD","Barley","Chickpeas","Lentils","Mustard","Austrians","Canola","Flax","Green Peas"],income:{bushelGuarantee:17.0,priceGuarantee:13.8,bushelProjection:15.0,currentPrice:13.0},expenseOverrides:{"cropInsurance":16.36,"gasFuelOil":11.0,"wages":16.0,"ira":2.5,"fertilizerChemical":41.0,"equipmentLoans":17.26,"equipmentPurchases":3.6,"landLeases":31.8,"groceries":2.06,"repairsMaintenance":8.7,"utilities":2.25,"propertyTax":4.6,"seed":7.56,"professionalFees":2.98,"misc":3.66,"freightCustomHire":0.9,"medical":0.69,"interestOperating":2.29}},
];


// ─── ROTATION RULES ───────────────────────────────────────────────────────────
const FIELD_PEAS = new Set(["Austrians","Green Peas","Yellow Peas"]);
// ── Default rotation rules config (editable, stored in Firebase) ─────────────
// RMA Crop Insurance Rotation Requirements — Montana (per RMA Special Provisions)
// selfGap = years before same crop can be replanted (insurable)
// conflictGap = years before conflicting crops can follow
// Source: RMA Crop Provisions + westernfrontierins.com/crop/rotation-info
const DEFAULT_ROTATION_CONFIG = {
  // Lentils: 2-yr self gap; any broadleaf in prior year = ineligible
  Lentils:     { selfGap: 2, conflictGap: 1, conflicts: ["Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax","Sunflowers"] },
  // Chickpeas: 3-yr self gap (strictest rule — Desi & Kabuli)
  Chickpeas:   { selfGap: 3, conflictGap: 0, conflicts: [] },
  // Austrian Winter Peas: 2-yr self gap; sunflowers 1-yr conflict
  Austrians:   { selfGap: 2, conflictGap: 1, conflicts: ["Green Peas","Yellow Peas","Lentils","Sunflowers"] },
  // Smooth Green Peas: 2-yr self gap; sunflowers & lentils 1-yr conflict
  "Green Peas":  { selfGap: 2, conflictGap: 1, conflicts: ["Yellow Peas","Austrians","Lentils","Sunflowers"] },
  // Smooth Yellow Peas: same as green peas
  "Yellow Peas": { selfGap: 2, conflictGap: 1, conflicts: ["Green Peas","Austrians","Lentils","Sunflowers"] },
  // Mustard: 1-yr self gap; canola, chickpeas, sunflowers conflict
  Mustard:     { selfGap: 1, conflictGap: 1, conflicts: ["Canola","Chickpeas","Sunflowers"] },
  // Canola: Montana = 1-yr rotation; chickpeas, mustard, sunflowers conflict
  Canola:      { selfGap: 1, conflictGap: 1, conflicts: ["Mustard","Chickpeas","Sunflowers"] },
};

// Global rotation config — loaded from Firebase on mount, falls back to DEFAULT
let _rotationConfig = { ...DEFAULT_ROTATION_CONFIG };

function getRotationConfig() { return _rotationConfig; }
function setRotationConfig(cfg) { _rotationConfig = cfg; }

function buildRotationRules(cfg) {
  const rules = {};
  Object.entries(cfg).forEach(([crop, r]) => {
    rules[crop] = (hist, yr) => {
      const y = +yr; const msgs = [];
      // Self gap — no same crop within selfGap years
      for (let i = 1; i <= r.selfGap; i++) {
        if (hist[y-i] === crop) msgs.push(`${crop} in ${y-i} (within ${r.selfGap} yr gap)`);
      }
      // Conflict gap — no conflicting crops within conflictGap years
      if (r.conflictGap > 0) {
        r.conflicts.filter(c => c !== crop).forEach(conflict => {
          for (let i = 1; i <= r.conflictGap; i++) {
            if (hist[y-i] === conflict) msgs.push(`${conflict} in ${y-i} (conflicts with ${crop})`);
          }
        });
      }
      return msgs;
    };
  });
  return rules;
}

// ROTATION_RULES is now a getter so it always uses current config
function getRotationRules() { return buildRotationRules(_rotationConfig); }

function checkRotationViolations(histData, year) {
  const rules = getRotationRules();
  const violations = [];
  Object.entries(histData).forEach(([key, d]) => {
    const crop = d.history[year];
    if (!crop) return;
    const checker = rules[crop];
    if (!checker) return;
    const msgs = checker(d.history, year);
    if (msgs.length > 0) violations.push({ key, common: d.common, fieldNum: d.fieldNum||"", legal: d.legal||"", acres: d.acres, crop, msgs });
  });
  return violations;
}

// ── Rotation Rules Editor Component ──────────────────────────────────────────
function RotationRulesEditor({ onClose }) {
  const [config, setConfig] = useState(() => JSON.parse(JSON.stringify(_rotationConfig)));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const ALL_CONFLICT_CROPS = ["Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Sunflowers"];
  const crops = Object.keys(config);

  const updateSelfGap = (crop, val) => {
    setConfig(c => ({ ...c, [crop]: { ...c[crop], selfGap: Math.max(0, parseInt(val)||0) }}));
  };
  const updateConflictGap = (crop, val) => {
    setConfig(c => ({ ...c, [crop]: { ...c[crop], conflictGap: Math.max(0, parseInt(val)||0) }}));
  };
  const toggleConflict = (crop, conflict) => {
    setConfig(c => {
      const cur = c[crop].conflicts;
      const updated = cur.includes(conflict) ? cur.filter(x=>x!==conflict) : [...cur, conflict];
      return { ...c, [crop]: { ...c[crop], conflicts: updated }};
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setRotationConfig(config);
    try {
      await fbSaveRotationRules(config);
      setSaved(true);
      setTimeout(() => { setSaved(false); setSaving(false); onClose(); }, 1000);
    } catch(e) {
      console.error("Failed to save rules:", e);
      setSaving(false);
    }
  };

  const handleReset = () => setConfig(JSON.parse(JSON.stringify(DEFAULT_ROTATION_CONFIG)));

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:3000}}>
      <div style={{background:"#fff",borderRadius:12,padding:28,width:640,maxHeight:"85vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.25)",border:"1px solid #ccdda0"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#1a3010"}}>Rotation Rules</div>
            <div style={{fontSize:11,color:"#7a9260",marginTop:2}}>Changes save to database and apply across all devices</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={handleReset} style={{background:"#f8fbf5",border:"1px solid #ccdda0",borderRadius:5,padding:"6px 14px",fontSize:11,cursor:"pointer",color:"#7a9260"}}>Reset to Default</button>
            <button onClick={handleSave} disabled={saving} style={{background:saved?"#4a9030":"#2a7a18",border:"none",borderRadius:5,padding:"6px 18px",fontSize:12,cursor:"pointer",color:"#fff",fontWeight:600}}>
              {saving?"Saving...":saved?"✓ Saved":"Save & Apply"}
            </button>
            <button onClick={onClose} style={{background:"none",border:"1px solid #ccdda0",borderRadius:5,padding:"6px 12px",fontSize:12,cursor:"pointer",color:"#7a9260"}}>✕</button>
          </div>
        </div>

        {/* Rules table */}
        {crops.map(crop => {
          const r = config[crop];
          return (
            <div key={crop} style={{marginBottom:16,padding:14,background:"#f8fbf5",borderRadius:8,border:"1px solid #ddecc0"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <span style={{background:cropColor(crop),color:"#fff",padding:"3px 12px",borderRadius:4,fontSize:13,fontWeight:700,minWidth:100,textAlign:"center"}}>{crop}</span>
                <div style={{display:"flex",alignItems:"center",gap:16}}>
                  <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#3a6020"}}>
                    <span>No {crop} within</span>
                    <input type="number" min={0} max={10} value={r.selfGap}
                      onChange={e=>updateSelfGap(crop, e.target.value)}
                      style={{width:44,textAlign:"center",background:"#fff",border:"1px solid #b8d09a",borderRadius:4,padding:"4px 6px",fontSize:13,fontFamily:"'IBM Plex Mono',monospace",fontWeight:600,color:"#1a3010"}}/>
                    <span>yr{r.selfGap!==1?"s":""}</span>
                  </label>
                  {r.conflictGap >= 0 && (
                    <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#3a6020"}}>
                      <span>Conflicts within</span>
                      <input type="number" min={0} max={10} value={r.conflictGap}
                        onChange={e=>updateConflictGap(crop, e.target.value)}
                        style={{width:44,textAlign:"center",background:"#fff",border:"1px solid #b8d09a",borderRadius:4,padding:"4px 6px",fontSize:13,fontFamily:"'IBM Plex Mono',monospace",fontWeight:600,color:"#1a3010"}}/>
                      <span>yr{r.conflictGap!==1?"s":""}</span>
                    </label>
                  )}
                </div>
              </div>
              {/* Conflict crops */}
              {r.conflictGap > 0 && (
                <div>
                  <div style={{fontSize:10,color:"#7a9260",marginBottom:6,textTransform:"uppercase",letterSpacing:0.6}}>Conflicting prior crops:</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {ALL_CONFLICT_CROPS.filter(c=>c!==crop).map(c=>{
                      const on = r.conflicts.includes(c);
                      return(
                        <label key={c} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 9px",background:on?"#e8f8e0":"#fff",border:`1px solid ${on?"#4a9030":"#ccdda0"}`,borderRadius:4,cursor:"pointer",fontSize:11,color:on?"#1a7010":"#7a9260"}}>
                          <input type="checkbox" checked={on} onChange={()=>toggleConflict(crop,c)} style={{margin:0}}/>
                          <span style={{background:cropColor(c),color:"#fff",padding:"1px 5px",borderRadius:2,fontSize:9,fontWeight:600}}>{c}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div style={{fontSize:10,color:"#b0b8a8",marginTop:4,fontStyle:"italic"}}>
          These rules apply to the rotation violation checker and crop suggestions. Update each spring when you receive new guidelines from your insurance agent.
        </div>
      </div>
    </div>
  );
}

// ─── CROP COLOR MAP ───────────────────────────────────────────────────────────
const CROP_COLORS = {
  "Spring Wheat":"#d4a84b","Winter Wheat":"#c49230","CC WW":"#b87d20","CC HAD":"#e8b840",
  "Barley":"#c8a060","Durum":"#d4b050",
  "Lentils":"#7cb87c","Chickpeas":"#5a9a5a","Austrians":"#4a8a4a","Green Peas":"#6ab86a","Yellow Peas":"#a0c050",
  "Mustard":"#d4c020","Canola":"#c8d020","Flax":"#5090c0",
  "Chem-Fallow":"#c0b8a8","Cover Crop":"#90b870","CRP":"#80a860",
  "Corn":"#e0a830","Hemp":"#6a9060","Sunflowers":"#e8c030",
  "Oats":"#d0b880","Quinoa":"#c0a0d0","Leaders":"#a080c0",
};
function cropColor(crop) { return CROP_COLORS[crop] || "#aabbaa"; }

// ─── HISTORY VIEW ─────────────────────────────────────────────────────────────
const HIST_YEARS = ["2015","2016","2017","2018","2019","2020","2021","2022","2023","2024","2025","2026"];

function HistoryView({ fields, allFields, onSelectField, aphData=null, fieldHistory=null }) {
  const [year, setYear] = useState("2026");
  const [search, setSearch] = useState("");
  const [filterViol, setFilterViol] = useState(false);
  const [sortKey, setSortKey] = useState("farm");

  // Build history data — merges manual fieldHistory (priority) + imported APH
  const histData = useMemo(() => {
    if (!aphData && !fieldHistory) return HISTORY_DATA;
    const built = {};

    const ensureField = (fieldCommon) => {
      const apField = allFields.find(f => f.common === fieldCommon);
      const key = `${fieldCommon}|${apField?.fieldNum||""}`;
      if(!built[key]) built[key] = {
        common: fieldCommon, farm: apField?.farm||"", fieldNum: apField?.fieldNum||"",
        acres: apField?.acres||0, history: {}
      };
      return key;
    };

    // Manual history takes priority (user entered, most accurate)
    if(fieldHistory) {
      Object.entries(fieldHistory).forEach(([fieldCommon, years]) => {
        const key = ensureField(fieldCommon);
        Object.entries(years).forEach(([yr, data]) => {
          if(data?.crop) built[key].history[yr] = data.crop;
        });
      });
    }

    // APH data fills gaps not covered by manual entries
    if(aphData) {
      Object.entries(aphData).forEach(([fieldCommon, crops]) => {
        const key = ensureField(fieldCommon);
        Object.entries(crops).forEach(([crop, cropData]) => {
          Object.keys(cropData.years||{}).forEach(yr => {
            if(!built[key].history[yr]) built[key].history[yr] = crop;
          });
        });
      });
    }

    return Object.keys(built).length > 0 ? built : HISTORY_DATA;
  }, [aphData, fieldHistory, allFields]);

  const [, forceUpdate] = useState(0);
  const violations = useMemo(() => checkRotationViolations(histData, year), [histData, year, forceUpdate]);
  const violKeys = useMemo(() => new Set(violations.map(v => v.key)), [violations]);

  // Build rows for selected year
  const rows = useMemo(() => {
    const yr = year;
    return Object.entries(histData)
      .filter(([key, d]) => {
        if (!d.history[yr]) return false;
        if (filterViol && !violKeys.has(key)) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!d.common.toLowerCase().includes(q) && !(d.fieldNum||"").toLowerCase().includes(q) && !(d.farm||"").toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a,b) => {
        if (sortKey==="farm") return ((a[1].farm||"")+(a[1].common||"")).localeCompare((b[1].farm||"")+(b[1].common||""),undefined,{numeric:true,sensitivity:"base"});
        if (sortKey==="crop") return (a[1].history[yr]||"").localeCompare(b[1].history[yr]||"");
        if (sortKey==="acres") return b[1].acres - a[1].acres;
        return 0;
      });
  }, [year, search, filterViol, sortKey, violKeys]);

  // Crop summary for year
  const cropSummary = useMemo(() => {
    const cm = {};
    Object.values(histData).forEach(d => {
      const crop = d.history[year];
      if (!crop) return;
      if (!cm[crop]) cm[crop] = { acres: 0, fields: 0 };
      cm[crop].acres += d.acres;
      cm[crop].fields++;
    });
    return Object.entries(cm).sort((a,b) => b[1].acres - a[1].acres);
  }, [year]);

  const totalAcres = rows.reduce((s,[,d]) => s+d.acres, 0);
  const yr = +year;

  const Th = ({label,k}) => (
    <th onClick={()=>setSortKey(k)}
      style={{padding:"6px 10px",background:"#1e3a18",color:sortKey===k?"#c8ffa0":"#c8e8a0",fontSize:9,textTransform:"uppercase",letterSpacing:0.6,cursor:"pointer",textAlign:"left",whiteSpace:"nowrap",fontWeight:sortKey===k?700:500}}>
      {label}{sortKey===k?" ↓":""}
    </th>
  );

  return (
    <div>
      {/* Year nav */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#1a4010"}}>Crop History</div>
        <div style={{display:"flex",alignItems:"center",gap:4,background:"#e8f0d8",borderRadius:6,padding:"4px 6px",border:"1px solid #ccdda0"}}>
          <button onClick={()=>setYear(y=>HIST_YEARS[Math.max(0,HIST_YEARS.indexOf(y)-1)])}
            disabled={year===HIST_YEARS[0]}
            style={{background:"none",border:"none",fontSize:16,cursor:"pointer",color:"#3a7020",padding:"0 4px",opacity:year===HIST_YEARS[0]?0.3:1}}>‹</button>
          {HIST_YEARS.map(y=>(
            <button key={y} onClick={()=>setYear(y)}
              style={{padding:"4px 10px",borderRadius:4,border:"none",cursor:"pointer",fontSize:12,fontWeight:y===year?700:400,
                background:y===year?"#1e3a18":"transparent",color:y===year?"#c8ffa0":"#527a38",fontFamily:"'IBM Plex Mono',monospace"}}>
              {y}
            </button>
          ))}
          <button onClick={()=>setYear(y=>HIST_YEARS[Math.min(HIST_YEARS.length-1,HIST_YEARS.indexOf(y)+1)])}
            disabled={year===HIST_YEARS[HIST_YEARS.length-1]}
            style={{background:"none",border:"none",fontSize:16,cursor:"pointer",color:"#3a7020",padding:"0 4px",opacity:year===HIST_YEARS[HIST_YEARS.length-1]?0.3:1}}>›</button>
        </div>
        <input placeholder="🔍 search..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{background:"#fff",border:"1px solid #b8d09a",borderRadius:4,padding:"5px 10px",fontSize:11,outline:"none",width:160,color:"#1a3010"}}/>
        <label style={{display:"flex",alignItems:"center",gap:6,fontSize:11,cursor:"pointer",color:violations.length>0?"#c02020":"#7a9260"}}>
          <input type="checkbox" checked={filterViol} onChange={e=>setFilterViol(e.target.checked)} style={{accentColor:"#c02020"}}/>
          Violations only ({violations.length})
        </label>
        <div style={{marginLeft:"auto",fontSize:11,color:"#7a9260"}}>{rows.length} fields · {totalAcres.toFixed(0)} ac</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:16,alignItems:"start"}}>
        {/* Main table */}
        <div>
          {/* Violation banner */}
          {violations.length > 0 && (
            <div style={{background:"#fff8f0",border:"1px solid #f0c090",borderRadius:8,padding:"10px 14px",marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:600,color:"#8a4010",marginBottom:6}}>
                ⚠ {violations.length} Rotation Violation{violations.length!==1?"s":""} for {year}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:5}}>
                {violations.map(v=>{
                  // Find matching field in allFields to navigate to
                  const targetField = allFields && allFields.find(f =>
                    f.common === v.common && f.fieldNum === (v.fieldNum||"")
                  ) || (allFields && allFields.find(f => f.common === v.common));
                  const clickable = !!targetField;
                  return(
                    <div key={v.key}
                      onClick={clickable ? ()=>onSelectField(targetField.id) : undefined}
                      style={{background:"#fff",border:"1px solid #f0c090",borderRadius:4,padding:"6px 9px",
                        cursor:clickable?"pointer":"default",
                        transition:"box-shadow 0.15s",
                        boxShadow:clickable?"0 1px 3px rgba(0,0,0,0.06)":""}}
                      onMouseEnter={e=>{if(clickable)e.currentTarget.style.boxShadow="0 3px 10px rgba(200,100,0,0.2)";}}
                      onMouseLeave={e=>{if(clickable)e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.06)";}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,marginBottom:2}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{background:cropColor(v.crop),padding:"1px 7px",borderRadius:3,fontSize:9,color:"#fff",fontWeight:600}}>{v.crop}</span>
                          <span style={{fontSize:11,fontWeight:600,color:"#1a3010"}}>{v.common}</span>
                          {v.fieldNum&&<span style={{fontSize:9,color:"#8a9a70"}}>#{v.fieldNum}</span>}
                        </div>
                        {clickable&&<span style={{fontSize:9,color:"#c06020",opacity:0.7}}>→ Edit</span>}
                      </div>
                      {v.msgs.map((m,i)=><div key={i} style={{fontSize:9,color:"#c05010"}}>• {m}</div>)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr>
                <Th label="Farm" k="farm"/>
                <Th label="Field" k="common"/>
                <th style={{padding:"6px 10px",background:"#1e3a18",color:"#c8e8a0",fontSize:9,textTransform:"uppercase",letterSpacing:0.6,textAlign:"left"}}>Field #</th>
                <Th label="Acres" k="acres"/>
                <Th label="Crop" k="crop"/>
                <th style={{padding:"6px 10px",background:"#1e3a18",color:"#c8e8a0",fontSize:9,textTransform:"uppercase",letterSpacing:0.6,textAlign:"left"}}>Prev Year</th>
                <th style={{padding:"6px 10px",background:"#1e3a18",color:"#c8e8a0",fontSize:9,textTransform:"uppercase",letterSpacing:0.6,textAlign:"left"}}>2 Yrs Ago</th>
                <th style={{padding:"6px 10px",background:"#1e3a18",color:"#c8e8a0",fontSize:9,textTransform:"uppercase",letterSpacing:0.6,textAlign:"left"}}>3 Yrs Ago</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([key,d],i)=>{
                const crop = d.history[year];
                const prev1 = d.history[String(yr-1)];
                const prev2 = d.history[String(yr-2)];
                const prev3 = d.history[String(yr-3)];
                const isViol = violKeys.has(key);
                const CropBadge = ({c}) => c ? (
                  <span style={{display:"inline-block",padding:"2px 7px",borderRadius:3,background:cropColor(c),color:"#fff",fontSize:10,fontWeight:600}}>{c}</span>
                ) : <span style={{color:"#ccc",fontSize:10}}>—</span>;
                return(
                  <tr key={key} style={{background:isViol?"#fff8f0":i%2===0?"#f6f9f0":"#ffffff"}}>
                    <td style={{padding:"5px 10px",color:"#527a38",fontSize:11,borderBottom:"1px solid #e0eccc"}}>{d.farm||"—"}</td>
                    <td style={{padding:"5px 10px",borderBottom:"1px solid #e0eccc"}}>
                      <span style={{fontWeight:600,color:"#1a3010"}}>{d.common}</span>
                      {isViol&&<span style={{marginLeft:5,fontSize:10,color:"#c05010"}}>⚠</span>}
                    </td>
                    <td style={{padding:"5px 10px",color:"#8a9a70",fontSize:10,borderBottom:"1px solid #e0eccc"}}>{d.fieldNum||"—"}</td>
                    <td style={{padding:"5px 10px",color:"#527a38",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,borderBottom:"1px solid #e0eccc"}}>{d.acres.toFixed(0)}</td>
                    <td style={{padding:"5px 10px",borderBottom:"1px solid #e0eccc"}}><CropBadge c={crop}/></td>
                    <td style={{padding:"5px 10px",borderBottom:"1px solid #e0eccc"}}><CropBadge c={prev1}/></td>
                    <td style={{padding:"5px 10px",borderBottom:"1px solid #e0eccc"}}><CropBadge c={prev2}/></td>
                    <td style={{padding:"5px 10px",borderBottom:"1px solid #e0eccc"}}><CropBadge c={prev3}/></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{background:"#e4f0d0"}}>
                <td colSpan={3} style={{padding:"7px 10px",fontSize:11,fontWeight:600,color:"#3a6020"}}>TOTALS — {rows.length} fields</td>
                <td style={{padding:"7px 10px",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:600,color:"#3a6020"}}>{totalAcres.toFixed(0)}</td>
                <td colSpan={4}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Crop summary sidebar */}
        <div style={{background:"#fff",border:"1px solid #ccdda0",borderRadius:8,padding:"14px",position:"sticky",top:0,maxHeight:"90vh",overflowY:"auto"}}>
          <div style={{fontSize:11,fontWeight:600,color:"#3a6020",textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>{year} Crop Summary</div>
          {[["All",null],...([...new Set(INITIAL_FIELDS.map(f=>f.entity))].filter(Boolean).map(e=>[e,e]))].map(([label,entityFilter])=>{
            // Build crop summary for this entity filter
            const filtered = Object.values(histData).filter(d=>{
              if(!d.history[year]) return false;
              if(!entityFilter) return true;
              // Match entity by checking INITIAL_FIELDS
              const match = INITIAL_FIELDS.find(f=>f.common===d.common&&f.fieldNum===d.fieldNum);
              return match ? match.entity===entityFilter : false;
            });
            if(entityFilter&&filtered.length===0) return null;
            const cm={};
            filtered.forEach(d=>{
              const crop=d.history[year];
              if(!cm[crop]) cm[crop]={acres:0,fields:0};
              cm[crop].acres+=d.acres; cm[crop].fields++;
            });
            const totalAc=filtered.reduce((s,d)=>s+d.acres,0);
            const sorted=Object.entries(cm).sort((a,b)=>b[1].acres-a[1].acres);
            if(sorted.length===0) return null;
            return(
              <div key={label} style={{marginBottom:16}}>
                <div style={{fontSize:10,color:"#3a6020",
                  textTransform:"uppercase",letterSpacing:0.8,fontWeight:700,marginBottom:8,
                  background:entityFilter?"#e8f8e0":"transparent",
                  padding:label!=="All"?"3px 7px":"0",borderRadius:3,display:"inline-block"}}>
                  {label} — {totalAc.toFixed(0)} ac
                </div>
                {sorted.map(([crop,d])=>{
                  const pct=(d.acres/totalAc*100).toFixed(1);
                  return(
                    <div key={crop} style={{marginBottom:7}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                        <span style={{background:cropColor(crop),color:"#fff",padding:"1px 7px",borderRadius:3,fontSize:10,fontWeight:600}}>{crop}</span>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"#527a38"}}>{d.acres.toFixed(0)} ac</span>
                      </div>
                      <div style={{height:5,background:"#e8f0d8",borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",background:cropColor(crop),width:pct+"%",borderRadius:3,opacity:0.8}}/>
                      </div>
                      <div style={{fontSize:9,color:"#8a9a70",marginTop:1}}>{pct}% · {d.fields} field{d.fields!==1?"s":""}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}



// ── Farm Expenses View ────────────────────────────────────────────────────────
function FarmExpensesView({ fields, activeYear, onApplyExpenses }) {
  const entities = [...new Set(fields.map(f=>f.entity).filter(Boolean))];
  const [activeEntity, setActiveEntity] = useState(()=>entities[0]||"");
  const [totals, setTotals] = useState(() => {
    // Initialize from current field expense overrides × acres
    const t = {};
    entities.forEach(entity => {
      t[entity] = {};
      EXP.forEach(([key]) => { t[entity][key] = ""; });
    });
    return t;
  });
  const [applied, setApplied] = useState(false);

  const entityFields = fields.filter(f => f.entity === activeEntity);
  const totalAcres = entityFields.reduce((s, f) => s + f.acres, 0);

  // Calculate current per-acre rates from field expense overrides
  const currentRates = useMemo(() => {
    const rates = {};
    EXP.forEach(([key]) => {
      const avg = entityFields.length > 0
        ? entityFields.reduce((s, f) => s + getRate(f, key), 0) / entityFields.length
        : 0;
      rates[key] = avg;
    });
    return rates;
  }, [entityFields, activeEntity]);

  const handleTotalChange = (key, val) => {
    setTotals(t => ({ ...t, [activeEntity]: { ...t[activeEntity], [key]: val } }));
    setApplied(false);
  };

  const getRateFromTotal = (key) => {
    const total = parseFloat(totals[activeEntity]?.[key]);
    if (!total || !totalAcres) return null;
    return total / totalAcres;
  };

  const totalEntered = EXP.reduce((s, [key]) => s + (parseFloat(totals[activeEntity]?.[key]) || 0), 0);
  const totalCurrent = EXP.reduce((s, [key]) => s + currentRates[key] * totalAcres, 0);

  const handleApply = () => {
    const updates = {};
    EXP.forEach(([key]) => {
      const rate = getRateFromTotal(key);
      if (rate !== null) updates[key] = Math.round(rate * 100) / 100;
    });
    onApplyExpenses(activeEntity, updates);
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  };

  const handleLoadCurrent = () => {
    // Pre-fill totals from current $/ac × acres
    const t = {};
    EXP.forEach(([key]) => {
      const total = currentRates[key] * totalAcres;
      t[key] = total > 0 ? f2(total) : "";
    });
    setTotals(prev => ({ ...prev, [activeEntity]: t }));
    setApplied(false);
  };

  return (
    <div style={{padding:"24px",maxWidth:1100,margin:"0 auto"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#1a3010"}}>Farm Expenses — {activeYear}</div>
          <div style={{fontSize:12,color:"#7a9260",marginTop:2}}>Enter total dollar amounts — the app divides by total acres to calculate per-acre rates for each field</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={handleLoadCurrent}
            style={{background:"#f4f8ee",border:"1px solid #b8d09a",borderRadius:5,padding:"7px 14px",fontSize:11,cursor:"pointer",color:"#3a6020",fontFamily:"'Barlow',sans-serif"}}>
            ↻ Load Current Rates
          </button>
          <button onClick={handleApply}
            disabled={totalEntered === 0}
            style={{background:applied?"#4a9030":totalEntered>0?"#2a7a18":"#aac890",border:"none",borderRadius:5,padding:"7px 18px",fontSize:12,fontWeight:600,cursor:totalEntered>0?"pointer":"not-allowed",color:"#fff",fontFamily:"'Barlow',sans-serif"}}>
            {applied ? "✓ Applied!" : `Apply to All ${activeEntity} Fields`}
          </button>
        </div>
      </div>

      {/* Entity tabs */}
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {entities.map(e => (
          <button key={e} onClick={()=>{setActiveEntity(e);setApplied(false);}}
            style={{padding:"6px 18px",borderRadius:5,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,
              background:e===activeEntity?"#2a7010":"#e8f0d8",
              color:e===activeEntity?"#fff":"#2a7010"}}>
            {e} — {fields.filter(f=>f.entity===e).reduce((s,f)=>s+f.acres,0).toFixed(0)} ac
          </button>
        ))}
      </div>

      {/* Summary strip */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
        <div style={{background:"#fff",border:"1px solid #ccdda0",borderRadius:8,padding:"12px 16px"}}>
          <div style={{fontSize:10,color:"#7a9260",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>Total Acres</div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:18,fontWeight:700,color:"#1a3010"}}>{totalAcres.toFixed(0)}</div>
        </div>
        <div style={{background:"#fff",border:"1px solid #ccdda0",borderRadius:8,padding:"12px 16px"}}>
          <div style={{fontSize:10,color:"#7a9260",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>Current Total Expenses</div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:18,fontWeight:700,color:"#c05010"}}>{f$(totalCurrent)}</div>
          <div style={{fontSize:10,color:"#8a9a70"}}>${f2(totalAcres>0?totalCurrent/totalAcres:0)}/ac</div>
        </div>
        <div style={{background:totalEntered>0?"#f4fce8":"#f8fbf5",border:`1px solid ${totalEntered>0?"#88c878":"#ccdda0"}`,borderRadius:8,padding:"12px 16px"}}>
          <div style={{fontSize:10,color:"#7a9260",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>New Total Entered</div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:18,fontWeight:700,color:totalEntered>0?"#2a7010":"#aab8a0"}}>{totalEntered>0?f$(totalEntered):"—"}</div>
          <div style={{fontSize:10,color:"#8a9a70"}}>{totalEntered>0&&totalAcres>0?`$${f2(totalEntered/totalAcres)}/ac`:""}</div>
        </div>
      </div>

      {/* Expense rows */}
      <div style={{background:"#fff",border:"1px solid #ccdda0",borderRadius:8,overflow:"hidden"}}>
        {/* Column headers */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 150px 130px 130px 110px",gap:0,background:"#1e3a18",padding:"8px 16px"}}>
          {["Category","Total $ Entered","÷ Acres","= $/Ac","Current $/Ac"].map((h,i)=>(
            <div key={h} style={{fontSize:9,color:"#c8e8a0",textTransform:"uppercase",letterSpacing:0.7,textAlign:i>0?"right":"left"}}>{h}</div>
          ))}
        </div>

        {EXP.map(([key, label], i) => {
          const enteredTotal = parseFloat(totals[activeEntity]?.[key]) || 0;
          const calcRate = getRateFromTotal(key);
          const curRate = currentRates[key];
          const diff = calcRate !== null ? calcRate - curRate : null;
          return (
            <div key={key}
              style={{display:"grid",gridTemplateColumns:"1fr 150px 130px 130px 110px",gap:0,padding:"8px 16px",
                background:i%2===0?"#f8fbf5":"#fff",borderBottom:"1px solid #eef4e8",alignItems:"center"}}>
              {/* Label */}
              <div style={{fontSize:12,color:"#1a3010",fontWeight:500}}>{label}</div>
              {/* Total input */}
              <div style={{textAlign:"right"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:4}}>
                  <span style={{fontSize:11,color:"#7a9260"}}>$</span>
                  <input type="number" min="0" step="100"
                    value={totals[activeEntity]?.[key] ?? ""}
                    onChange={e=>handleTotalChange(key, e.target.value)}
                    placeholder={f2(curRate * totalAcres)}
                    style={{width:110,textAlign:"right",background:"#f0f8e8",border:"1px solid #b8d09a",
                      borderRadius:4,padding:"5px 8px",fontSize:12,fontFamily:"'IBM Plex Mono',monospace",
                      color:"#1a3010",outline:"none"}}/>
                </div>
              </div>
              {/* Acres */}
              <div style={{textAlign:"right",fontSize:11,color:"#8a9a70",fontFamily:"'IBM Plex Mono',monospace"}}>
                ÷ {totalAcres.toFixed(0)}
              </div>
              {/* Calculated $/ac */}
              <div style={{textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,
                color:calcRate!==null?(diff>0.5?"#c05010":diff<-0.5?"#2a7010":"#1a3010"):"#b0c0a0",fontWeight:calcRate!==null?600:400}}>
                {calcRate !== null ? (
                  <span>${f2(calcRate)}
                    {diff!==null&&Math.abs(diff)>0.1&&<span style={{fontSize:9,marginLeft:4,color:diff>0?"#c05010":"#2a7010"}}>
                      ({diff>0?"+":""}{f2(diff)})
                    </span>}
                  </span>
                ) : <span style={{color:"#c0c8b0"}}>—</span>}
              </div>
              {/* Current $/ac */}
              <div style={{textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"#7a9260"}}>
                ${f2(curRate)}
              </div>
            </div>
          );
        })}

        {/* Total row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 150px 130px 130px 110px",gap:0,padding:"10px 16px",background:"#1e3a18",alignItems:"center"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#c8e8a0",textTransform:"uppercase",letterSpacing:0.8}}>Total</div>
          <div style={{textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontSize:13,fontWeight:700,color:totalEntered>0?"#90e870":"#5a7a50"}}>{totalEntered>0?`$${f$(totalEntered)}`:"—"}</div>
          <div/>
          <div style={{textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontSize:13,fontWeight:700,color:"#90e870"}}>{totalEntered>0&&totalAcres>0?`$${f2(totalEntered/totalAcres)}/ac`:""}</div>
          <div style={{textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"#5a8a50"}}>${f2(totalAcres>0?totalCurrent/totalAcres:0)}</div>
        </div>
      </div>

      <div style={{fontSize:10,color:"#8a9a70",marginTop:10,fontStyle:"italic"}}>
        Clicking "Apply" sets the $/ac rate as an override on every {activeEntity} field. Individual fields can still be overridden separately in the field detail view. Use "↻ Load Current Rates" to pre-fill with existing rates × acres.
      </div>
    </div>
  );
}

// ── CSV Export ────────────────────────────────────────────────────────────────
function exportCSV(fields){
  const sep=",";const q=v=>`"${String(v).replace(/"/g,'""')}"`;const rows=[];
  rows.push([q("AGRIPLAN 2025 — FULL FARM INCOME & EXPENSE REPORT"),q(""),q("Date: "+new Date().toLocaleDateString())].join(sep));
  rows.push("");
  rows.push(q("=== FIELD DETAIL ==="));
  rows.push(["Entity","Farm","Legal","Common","Field #","Acres","Crop","Bu Guarantee","Price Guarantee","Value/Ac","Ins. Guarantee","Bu Projection","Curr Price","Proj Revenue","Risk",...EXP.map(([,l])=>l),"Total Exp $/Ac","Total Expenses","Net Income"].map(q).join(sep));
  fields.forEach(f=>{const c=calc(f);rows.push([q(f.entity),q(f.farm),q(f.legal),q(f.common),q(f.fieldNum),f.acres.toFixed(2),q(f.crop),f.income.bushelGuarantee,f.income.priceGuarantee,c.valAcre.toFixed(2),c.guarantee.toFixed(2),f.income.bushelProjection,f.income.currentPrice,c.revenue.toFixed(2),c.risk.toFixed(2),...EXP.map(([k])=>getRate(f,k).toFixed(2)),c.expRate.toFixed(2),c.expenses.toFixed(2),c.net.toFixed(2)].join(sep));});
  rows.push("");
  rows.push(q("=== CROP SUMMARY ==="));
  rows.push(["Crop","Acres","% of Total","Proj Revenue","Rev $/Ac","Ins Guarantee","Total Expenses","Exp $/Ac","Net Income","Net $/Ac"].map(q).join(sep));
  const totalAcres=fields.reduce((s,f)=>s+f.acres,0);
  const cm={};fields.forEach(f=>{if(!cm[f.crop])cm[f.crop]={acres:0,revenue:0,guarantee:0,expenses:0};const c=calc(f);cm[f.crop].acres+=f.acres;cm[f.crop].revenue+=c.revenue;cm[f.crop].guarantee+=c.guarantee;cm[f.crop].expenses+=c.expenses;});
  Object.entries(cm).sort((a,b)=>b[1].acres-a[1].acres).forEach(([crop,d])=>{const net=d.revenue-d.expenses;rows.push([q(crop),d.acres.toFixed(1),(d.acres/totalAcres*100).toFixed(1)+"%",d.revenue.toFixed(2),(d.revenue/d.acres).toFixed(2),d.guarantee.toFixed(2),d.expenses.toFixed(2),(d.expenses/d.acres).toFixed(2),net.toFixed(2),(net/d.acres).toFixed(2)].join(sep));});
  rows.push("");
  rows.push(q("=== EXPENSE CATEGORY SUMMARY ==="));
  rows.push(["Category","2026 Total $","2026 $/Ac","2024 Budget $/Ac","2023 Actual $/Ac","Change vs 2023 $/Ac","Change %","% of Revenue"].map(q).join(sep));
  const totRev=fields.reduce((s,f)=>s+calc(f).revenue,0);
  EXP.forEach(([key,label])=>{const tot=fields.reduce((s,f)=>s+getRate(f,key)*f.acres,0);const avg=tot/totalAcres;const a23=ACTUALS_2023[key];const chg=avg-a23;rows.push([q(label),tot.toFixed(2),avg.toFixed(2),BUDGET_2024[key].toFixed(2),a23.toFixed(2),chg.toFixed(2),(a23>0?chg/a23*100:0).toFixed(1)+"%",(totRev>0?tot/totRev*100:0).toFixed(1)+"%"].join(sep));});
  const blob=new Blob([rows.join("\n")],{type:"text/csv"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="AgriPlan_2025_Budget.csv";a.click();
}

// ── Print / PDF ───────────────────────────────────────────────────────────────
function openPrint(fields,entityFilter){
  const title=entityFilter==="all"?"Farm Budget":entityFilter;
  const totAc=fields.reduce((s,f)=>s+f.acres,0);const totRev=fields.reduce((s,f)=>s+calc(f).revenue,0);
  const totGuar=fields.reduce((s,f)=>s+calc(f).guarantee,0);const totExp=fields.reduce((s,f)=>s+calc(f).expenses,0);const totNet=totRev-totExp;
  const fmt=n=>"$"+Math.abs(n).toLocaleString("en-US",{maximumFractionDigits:0});
  const fmtN=n=>n<0?"("+fmt(n)+")":fmt(n);
  const fmtR=n=>"$"+n.toFixed(2);
  const pct=(a,b)=>b>0?(a/b*100).toFixed(1)+"%":"—";
  const cm={};fields.forEach(f=>{if(!cm[f.crop])cm[f.crop]={acres:0,revenue:0,guarantee:0,expenses:0};const c=calc(f);cm[f.crop].acres+=f.acres;cm[f.crop].revenue+=c.revenue;cm[f.crop].guarantee+=c.guarantee;cm[f.crop].expenses+=c.expenses;});
  const expTots={};EXP.forEach(([k])=>{expTots[k]=fields.reduce((s,f)=>s+getRate(f,k)*f.acres,0);});
  const entMap={};fields.forEach(f=>{if(!entMap[f.entity])entMap[f.entity]={acres:0,revenue:0,guarantee:0,expenses:0};const c=calc(f);entMap[f.entity].acres+=f.acres;entMap[f.entity].revenue+=c.revenue;entMap[f.entity].guarantee+=c.guarantee;entMap[f.entity].expenses+=c.expenses;});

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&family=Barlow+Condensed:wght@400;500;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Barlow Condensed',sans-serif;font-size:10.5px;color:#111;background:#fff;padding:0}
    @page{margin:14mm 10mm;size:letter landscape}
    .page{padding:6mm 8mm}
    h1{font-family:'Libre Baskerville',serif;font-size:20px;color:#1a3a10;margin-bottom:2px}
    h2{font-family:'Libre Baskerville',serif;font-size:12px;color:#2a5a20;margin:14px 0 5px;border-bottom:2px solid #4a8a30;padding-bottom:3px;text-transform:uppercase;letter-spacing:0.5px}
    .meta{font-size:9.5px;color:#5a7a4a;margin-bottom:10px}
    .sg{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin-bottom:14px}
    .sc{border:1px solid #c8dca8;padding:7px 9px;border-radius:3px;background:#f8fcf4}
    .sc .lb{font-size:7.5px;text-transform:uppercase;letter-spacing:0.8px;color:#6a9a50}
    .sc .vl{font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:500;color:#1a3a10;margin-top:1px}
    .sc .sb{font-size:7.5px;color:#8aaa70;margin-top:1px}
    table{width:100%;border-collapse:collapse;margin-bottom:10px;font-size:9.5px}
    thead th{background:#1e3a18;color:#c8e8a0;font-size:8px;text-transform:uppercase;letter-spacing:0.5px;padding:4px 6px;text-align:left}
    thead th.r{text-align:right}thead th.c{text-align:center}
    tbody tr:nth-child(even){background:#f4f9f0}
    td{padding:3.5px 6px;border-bottom:1px solid #e0eccc}
    td.r{text-align:right;font-family:'IBM Plex Mono',monospace;font-size:9px}
    td.neg{color:#b52020}td.pos{color:#1a6a10}td.warn{color:#8a6000}
    tfoot td{background:#e8f4d8;font-weight:600;border-top:2px solid #4a8a30;font-size:10px}
    .pb{page-break-before:always}.nop{page-break-before:avoid}
    .badge{display:inline-block;padding:1px 5px;border-radius:2px;font-size:7.5px;font-weight:600}
    .ent{background:#e8f0d8;color:#2a5a10}
    .dot{display:inline-block;width:5px;height:5px;border-radius:50%;margin-right:3px;vertical-align:middle}
    .dg{background:#3a9a28}.dr{background:#c02020}
    .toolbar{background:#2a5a20;padding:10px 18px;margin-bottom:14px;display:flex;align-items:center;gap:14px}
    .btn{border:none;padding:7px 18px;border-radius:3px;font-size:12px;cursor:pointer;font-family:'Barlow Condensed',sans-serif;font-weight:600}
    @media print{.toolbar{display:none}}
  `;

  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AgriPlan 2025 — ${title}</title><style>${css}</style></head><body>
<div class="toolbar">
  <span style="color:#c8e8a0;font-size:17px;font-weight:700">🌾 AgriPlan 2025 — ${title}</span>
  <button class="btn" style="background:#5cb850;color:#fff" onclick="window.print()">🖨 Print / Save PDF</button>
  <button class="btn" style="background:#3a3a3a;color:#ccc" onclick="window.close()">Close</button>
</div>
<div class="page">
<h1>${title}</h1>
<p style="font-family:'Libre Baskerville',serif;font-size:13px;color:#5a7a4a;font-style:italic;margin-bottom:4px">2025 Projected Farm Income &amp; Expense Budget</p>
<div class="meta">Generated ${new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})} &nbsp;·&nbsp; ${fields.length} field units &nbsp;·&nbsp; ${totAc.toFixed(1)} total acres</div>

<div class="sg">
  <div class="sc"><div class="lb">Total Acres</div><div class="vl">${totAc.toFixed(0)}</div><div class="sb">${fields.length} field units</div></div>
  <div class="sc"><div class="lb">Projected Revenue</div><div class="vl">${fmt(totRev)}</div><div class="sb">${fmtR(totRev/totAc)}/ac avg</div></div>
  <div class="sc"><div class="lb">Ins. Guarantee</div><div class="vl">${fmt(totGuar)}</div><div class="sb">${fmtR(totGuar/totAc)}/ac avg</div></div>
  <div class="sc"><div class="lb">Total Expenses</div><div class="vl">${fmt(totExp)}</div><div class="sb">${fmtR(totExp/totAc)}/ac avg</div></div>
  <div class="sc"><div class="lb">Net Income</div><div class="vl" style="color:${totNet>=0?"#1a5a10":"#b52020"}">${fmtN(totNet)}</div><div class="sb">${fmtR(totNet/totAc)}/ac avg</div></div>
</div>

<h2>Crop Summary</h2>
<table><thead><tr>
  <th>Crop</th><th class="r">Acres</th><th class="r">% Total</th>
  <th class="r">Ins. Guarantee</th><th class="r">Guar $/Ac</th>
  <th class="r">Proj. Revenue</th><th class="r">Rev $/Ac</th>
  <th class="r">Total Expenses</th><th class="r">Exp $/Ac</th>
  <th class="r">Net Income</th><th class="r">Net $/Ac</th>
</tr></thead><tbody>
${Object.entries(cm).sort((a,b)=>b[1].acres-a[1].acres).map(([crop,d])=>{const net=d.revenue-d.expenses;const ni=net>=0?"pos":"neg";return`<tr>
  <td><strong>${crop}</strong></td>
  <td class="r">${d.acres.toFixed(1)}</td><td class="r">${pct(d.acres,totAc)}</td>
  <td class="r">${fmt(d.guarantee)}</td><td class="r">${fmtR(d.guarantee/d.acres)}</td>
  <td class="r">${fmt(d.revenue)}</td><td class="r">${fmtR(d.revenue/d.acres)}</td>
  <td class="r">${fmt(d.expenses)}</td><td class="r">${fmtR(d.expenses/d.acres)}</td>
  <td class="r ${ni}">${fmtN(net)}</td><td class="r ${ni}">${fmtR(net/d.acres)}</td>
</tr>`;}).join("")}
</tbody><tfoot><tr>
  <td><strong>TOTAL</strong></td><td class="r"><strong>${totAc.toFixed(1)}</strong></td><td class="r">100%</td>
  <td class="r"><strong>${fmt(totGuar)}</strong></td><td class="r">${fmtR(totGuar/totAc)}</td>
  <td class="r"><strong>${fmt(totRev)}</strong></td><td class="r">${fmtR(totRev/totAc)}</td>
  <td class="r"><strong>${fmt(totExp)}</strong></td><td class="r">${fmtR(totExp/totAc)}</td>
  <td class="r ${totNet>=0?"pos":"neg"}"><strong>${fmtN(totNet)}</strong></td><td class="r ${totNet>=0?"pos":"neg"}">${fmtR(totNet/totAc)}</td>
</tr></tfoot></table>

<h2>Expense Category Breakdown &amp; Year-over-Year Comparison</h2>
<table><thead><tr>
  <th>Category</th>
  <th class="r">2026 Total $</th><th class="r">2026 $/Ac</th>
  <th class="r">2024 Budget $/Ac</th><th class="r">2023 Actual $/Ac</th>
  <th class="r">Δ vs 2023 $/Ac</th><th class="r">Δ %</th>
  <th class="r">% of Revenue</th>
</tr></thead><tbody>
${EXP.map(([key,label])=>{
  const tot=expTots[key];const avg=tot/totAc;const a23=ACTUALS_2023[key];const b24=BUDGET_2024[key];const chg=avg-a23;const cls=chg>0?"neg":chg<0?"pos":"";
  return`<tr>
    <td>${label}</td>
    <td class="r">${fmt(tot)}</td><td class="r">${fmtR(avg)}</td>
    <td class="r warn">${fmtR(b24)}</td><td class="r">${fmtR(a23)}</td>
    <td class="r ${cls}">${chg>=0?"+":""}${fmtR(chg)}</td>
    <td class="r ${cls}">${chg>=0?"+":""}${a23>0?(chg/a23*100).toFixed(1):0}%</td>
    <td class="r">${pct(tot,totRev)}</td>
  </tr>`;}).join("")}
</tbody><tfoot><tr>
  <td><strong>TOTAL</strong></td>
  <td class="r"><strong>${fmt(totExp)}</strong></td>
  <td class="r"><strong>${fmtR(totExp/totAc)}</strong></td>
  <td class="r">${fmtR(Object.values(BUDGET_2024).reduce((s,v)=>s+v,0))}</td>
  <td class="r">${fmtR(Object.values(ACTUALS_2023).reduce((s,v)=>s+v,0))}</td>
  <td class="r"></td><td class="r"></td>
  <td class="r"><strong>${pct(totExp,totRev)}</strong></td>
</tr></tfoot></table>

${Object.keys(entMap).length>1?`<h2>Entity Summary</h2>
<table><thead><tr><th>Entity</th><th class="r">Acres</th><th class="r">Revenue</th><th class="r">Rev $/Ac</th><th class="r">Ins. Guarantee</th><th class="r">Expenses</th><th class="r">Exp $/Ac</th><th class="r">Net Income</th><th class="r">Net $/Ac</th></tr></thead><tbody>
${Object.entries(entMap).map(([ent,d])=>{const net=d.revenue-d.expenses;return`<tr><td><strong>${ent}</strong></td><td class="r">${d.acres.toFixed(1)}</td><td class="r">${fmt(d.revenue)}</td><td class="r">${fmtR(d.revenue/d.acres)}</td><td class="r">${fmt(d.guarantee)}</td><td class="r">${fmt(d.expenses)}</td><td class="r">${fmtR(d.expenses/d.acres)}</td><td class="r ${net>=0?"pos":"neg"}">${fmtN(net)}</td><td class="r ${net>=0?"pos":"neg"}">${fmtR(net/d.acres)}</td></tr>`;}).join("")}
</tbody></table>`:""}

<div class="pb"></div>

<h2>Field Detail — All Fields</h2>
<table><thead><tr>
  <th>Ent</th><th>Farm / Landlord</th><th>Field Name</th><th class="c">Field #</th>
  <th class="r">Acres</th><th>Crop</th>
  <th class="r">Bu Proj</th><th class="r">Price</th>
  <th class="r">Ins. Guarantee</th><th class="r">Guar $/Ac</th>
  <th class="r">Revenue</th><th class="r">Rev $/Ac</th>
  <th class="r">Expenses</th><th class="r">Exp $/Ac</th>
  <th class="r">Net Income</th>
</tr></thead><tbody>
${[...fields].sort((a,b)=>(a.farm||"").localeCompare(b.farm||"",undefined,{numeric:true,sensitivity:"base"})||(a.common||"").localeCompare(b.common||"",undefined,{numeric:true,sensitivity:"base"})).map(f=>{const c=calc(f);const inelig=(_globallyIneligible||GLOBALLY_INELIGIBLE).has(f.crop)||!(f.eligibleCrops||[]).includes(f.crop);const ni=c.net>=0?"pos":"neg";return`<tr>
  <td><span class="badge ent">${(f.entity||"").slice(0,8)||"—"}</span></td>
  <td>${f.farm}</td>
  <td><strong>${f.common}</strong></td>
  <td style="font-size:8.5px;color:#5a7a5a;text-align:center">${f.fieldNum}</td>
  <td class="r">${f.acres.toFixed(1)}</td>
  <td><span class="dot ${inelig?"dr":"dg"}"></span>${f.crop}</td>
  <td class="r">${f.income.bushelProjection}</td>
  <td class="r">$${f.income.currentPrice}</td>
  <td class="r">${fmt(c.guarantee)}</td>
  <td class="r">${fmtR(c.valAcre)}</td>
  <td class="r">${fmt(c.revenue)}</td>
  <td class="r">${fmtR(c.revenue/f.acres)}</td>
  <td class="r">${fmt(c.expenses)}</td>
  <td class="r">${fmtR(c.expRate)}</td>
  <td class="r ${ni}">${fmtN(c.net)}</td>
</tr>`;}).join("")}
</tbody><tfoot><tr>
  <td colspan="4"><strong>TOTALS</strong></td>
  <td class="r"><strong>${totAc.toFixed(1)}</strong></td>
  <td colspan="3"></td>
  <td class="r"><strong>${fmt(totGuar)}</strong></td><td class="r">${fmtR(totGuar/totAc)}</td>
  <td class="r"><strong>${fmt(totRev)}</strong></td><td class="r">${fmtR(totRev/totAc)}</td>
  <td class="r"><strong>${fmt(totExp)}</strong></td><td class="r">${fmtR(totExp/totAc)}</td>
  <td class="r ${totNet>=0?"pos":"neg"}"><strong>${fmtN(totNet)}</strong></td>
</tr></tfoot></table>
</div></body></html>`;

  const w=window.open("","_blank");w.document.write(html);w.document.close();
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function SCard({label,val,color,sub}){
  return(<div style={{background:"#ffffff",border:"1px solid #ccdda8",borderRadius:8,padding:"14px 16px",boxShadow:"0 1px 4px rgba(30,58,24,0.07)"}}>
    <div style={{fontSize:10,color:"#6a8a50",textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{label}</div>
    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:18,fontWeight:500,color}}>{val}</div>
    {sub&&<div style={{fontSize:10,color:"#8a9a70",marginTop:3}}>{sub}</div>}
  </div>);
}

function CropSelect({value,onChange,eligibleCrops}){
  const[open,setOpen]=useState(false);const ref=useRef();
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const _ec=Array.isArray(eligibleCrops)?eligibleCrops:eligibleCrops&&typeof eligibleCrops==="object"?Object.values(eligibleCrops):[]; const isInelig=c=>(_globallyIneligible||GLOBALLY_INELIGIBLE).has(c)||!(_ec.length>0?_ec:(_tenantCrops||ALL_CROPS)).includes(c);
  return(<div ref={ref} style={{position:"relative",display:"inline-block"}}>
    <button onClick={()=>setOpen(!open)} style={{background:"#ffffff",border:"1px solid #2a4030",borderRadius:5,padding:"7px 12px",color:"#1a3010",cursor:"pointer",fontSize:13,fontFamily:"'Barlow',sans-serif",display:"flex",alignItems:"center",gap:8,minWidth:185}}>
      <span style={{width:8,height:8,borderRadius:"50%",background:isInelig(value)?"#c02020":"#3a9020",flexShrink:0}}/>
      <span style={{flex:1,textAlign:"left"}}>{value}</span>
      <span style={{fontSize:10,opacity:0.5}}>▾</span>
    </button>
    {open&&(<div style={{position:"absolute",top:"100%",left:0,zIndex:200,background:"#f8fbf5",border:"1px solid #2a4030",borderRadius:5,width:240,maxHeight:300,overflowY:"auto",boxShadow:"0 8px 32px rgba(0,0,0,.7)",marginTop:2}}>
      <div style={{padding:"6px 10px 2px",fontSize:9,color:"#4a8a30",textTransform:"uppercase",letterSpacing:1}}>✓ Eligible for this field</div>
      {(_tenantCrops||ALL_CROPS).filter(c=>!isInelig(c)).map(c=>(<div key={c} onClick={()=>{onChange(c);setOpen(false);}} style={{padding:"7px 12px",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:8,color:c===value?"#1a6010":"#1a4010",background:c===value?"#d4ecc0":"transparent"}} onMouseEnter={e=>e.currentTarget.style.background="#d4ecc0"} onMouseLeave={e=>e.currentTarget.style.background=c===value?"#d4ecc0":"transparent"}><span style={{width:6,height:6,borderRadius:"50%",background:"#3a9020",flexShrink:0}}/>{c}{c===value&&<span style={{marginLeft:"auto",fontSize:10,color:"#3a8020"}}>✓</span>}</div>))}
      <div style={{padding:"8px 10px 2px",fontSize:9,color:"#904040",textTransform:"uppercase",letterSpacing:1,borderTop:"1px solid #2a2010",marginTop:4}}>✗ Not eligible</div>
      {(_tenantCrops||ALL_CROPS).filter(c=>isInelig(c)).map(c=>(<div key={c} style={{padding:"7px 12px",fontSize:12,display:"flex",alignItems:"center",gap:8,color:"#7a3030",cursor:"not-allowed",opacity:0.7}} title={(_globallyIneligible||GLOBALLY_INELIGIBLE).has(c)?"Region ineligible":"No APH on this field"}><span style={{width:6,height:6,borderRadius:"50%",background:"#c02020",flexShrink:0}}/>{c}<span style={{marginLeft:"auto",fontSize:9,color:"#904040"}}>{(_globallyIneligible||GLOBALLY_INELIGIBLE).has(c)?"Region":"No APH"}</span></div>))}
    </div>)}
  </div>);
}


// ── Field History + Crop Suggestions ─────────────────────────────────────────
function getFieldHistory(field) {
  // Primary: match by common|fieldNum — most reliable since fieldNum distinguishes west 5 from west 6 etc.
  const keyFn = field.common + '|' + field.fieldNum;
  if (HISTORY_DATA[keyFn]) return HISTORY_DATA[keyFn];
  // Secondary: common|legal
  const keyLegal = field.common + '|' + field.legal;
  if (HISTORY_DATA[keyLegal]) return HISTORY_DATA[keyLegal];
  // Fallback: match by common name, prefer fieldNum match, then closest acres
  const byCommon = Object.values(HISTORY_DATA).filter(d =>
    d.common.toLowerCase() === field.common.toLowerCase()
  );
  if (byCommon.length === 1) return byCommon[0];
  if (byCommon.length > 1) {
    const fnMatch = byCommon.find(d => d.fieldNum === field.fieldNum);
    if (fnMatch) return fnMatch;
    return byCommon.reduce((best, d) =>
      Math.abs(d.acres - field.acres) < Math.abs(best.acres - field.acres) ? d : best
    );
  }
  return null;
}

function getCropSuggestions(historyEntry, activeYear) {
  if (!historyEntry) return [];
  const hist = historyEntry.history;
  const nextYr = String(+activeYear + 1);

  // Build list of eligible crops with reasoning
  const suggestions = [];
  const eligibleBase = ["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Durum",
    "Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians","Mustard","Canola","Flax"];

  for (const crop of eligibleBase) {
    if ((_globallyIneligible||GLOBALLY_INELIGIBLE).has(crop)) continue;
    const checker = getRotationRules()[crop];
    const violations = checker ? checker(hist, nextYr) : [];

    // Score: prefer crops not used recently, penalize violations
    const lastUsed = Object.keys(hist).filter(y => hist[y] === crop).sort().pop();
    const yearsAgo = lastUsed ? +nextYr - +lastUsed : 99;

    suggestions.push({
      crop,
      eligible: violations.length === 0,
      violations,
      lastUsed: lastUsed || null,
      yearsAgo,
    });
  }

  // Sort: eligible first, then by years-ago desc (longest rotation first)
  return suggestions.sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    return b.yearsAgo - a.yearsAgo;
  });
}


// ── Historical Revenue Storage ────────────────────────────────────────────────
function loadHistRevenue() { return loadHistRevCache(); }
function saveHistRevenue(data) {
  saveHistRevCache(data);
  fbSaveHistRevenue(data).catch(()=>{});
}
function getRevKey(field, year) {
  return field.common + '|' + field.legal + '|' + year;
}

// ── Revenue Input Modal ────────────────────────────────────────────────────────
function RevenueInputModal({ field, year, crop, existingData, onSave, onClose }) {
  const [revenue, setRevenue] = useState(existingData?.revenue ?? '');
  const [totalExpenses, setTotalExpenses] = useState(existingData?.totalExpenses ?? '');
  const [bushelYield, setBushelYield] = useState(existingData?.bushelYield ?? '');
  const [soldPrice, setSoldPrice] = useState(existingData?.soldPrice ?? '');

  const acres = field.acres;
  const buYield = parseFloat(bushelYield) || 0;
  const price = parseFloat(soldPrice) || 0;
  // Auto-calculate revenue from bu/ac x acres x price; override with manual entry
  const calcedRevenue = buYield > 0 && price > 0 ? buYield * acres * price : 0;
  const revManual = parseFloat(revenue) || 0;
  const rev = revenue !== '' ? revManual : calcedRevenue;
  const autoCalc = calcedRevenue > 0 && revenue === '';
  const exp = parseFloat(totalExpenses) || 0;
  const net = rev - exp;
  const expPerAc = acres > 0 ? exp / acres : 0;

  const inp = (label, val, setter, prefix, readOnly, hint) => (
    <label style={{display:"flex",flexDirection:"column",gap:4}}>
      <span style={{fontSize:10,color:"#527a38",textTransform:"uppercase",letterSpacing:0.8,display:"flex",justifyContent:"space-between"}}>
        <span>{label}</span>
        {hint&&<span style={{color:"#8a9a70",fontSize:9,fontStyle:"italic",textTransform:"none"}}>{hint}</span>}
      </span>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        {prefix&&<span style={{color:"#527a38",fontSize:13}}>{prefix}</span>}
        <input type="number" value={readOnly ? f2(rev) : val} onChange={e=>!readOnly&&setter(e.target.value)} step="0.01"
          readOnly={readOnly}
          style={{background:readOnly?"#eef8e8":"#f4f8ee",border:"1px solid "+(readOnly?"#88c878":"#b8d09a"),borderRadius:5,padding:"8px 10px",fontSize:14,fontFamily:"'IBM Plex Mono',monospace",color:readOnly?"#2a6010":"#1a3010",width:"100%",outline:"none"}}/>
      </div>
    </label>
  );

  const handleSave = () => {
    onSave({ revenue: rev, totalExpenses: exp, bushelYield: buYield, soldPrice: price, crop: crop||'', acres });
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000}}>
      <div style={{background:"#fff",borderRadius:12,padding:28,width:480,boxShadow:"0 20px 60px rgba(0,0,0,0.2)",border:"1px solid #ccdda0"}}>
        {/* Header */}
        <div style={{marginBottom:20}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#1a3010",marginBottom:4}}>
            Input Revenue Data
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#7a9260"}}>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,color:"#1a5010"}}>{year}</span>
            <span>·</span>
            <span style={{background:cropColor(crop||''),color:"#fff",padding:"1px 8px",borderRadius:3,fontSize:11,fontWeight:600}}>{crop||"Unknown crop"}</span>
            <span>·</span>
            <span>{field.common}</span>
            <span>·</span>
            <span>{acres.toFixed(0)} ac</span>
          </div>
        </div>

        {/* Step 1: yield + price → auto revenue */}
        <div style={{fontSize:10,color:"#527a38",textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>Step 1 — Yield & Price</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:8}}>
          {inp("Bushels / Acre",bushelYield,setBushelYield,"")}
          {inp("Sold Price $/bu",soldPrice,setSoldPrice,"$")}
        </div>
        {/* Step 2: auto or manual revenue */}
        <div style={{fontSize:10,color:"#527a38",textTransform:"uppercase",letterSpacing:0.8,marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>Step 2 — Revenue</span>
          {autoCalc&&<span style={{fontSize:9,color:"#2a7010",background:"#e8f8e0",padding:"1px 7px",borderRadius:3}}>✓ Auto-calculated from yield × price × {acres.toFixed(0)} ac</span>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          <div>
            {autoCalc
              ? (<label style={{display:"flex",flexDirection:"column",gap:4}}>
                  <span style={{fontSize:10,color:"#2a7010",textTransform:"uppercase",letterSpacing:0.8}}>Total Revenue $ (auto)</span>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{color:"#2a7010",fontSize:13}}>$</span>
                    <div style={{background:"#eef8e8",border:"1px solid #88c878",borderRadius:5,padding:"8px 10px",fontSize:14,fontFamily:"'IBM Plex Mono',monospace",color:"#2a6010",flex:1,fontWeight:600}}>
                      {rev.toLocaleString("en-US",{maximumFractionDigits:0})}
                    </div>
                  </div>
                  <span style={{fontSize:10,color:"#7a9a70"}}>Override: <input type="number" value={revenue} onChange={e=>setRevenue(e.target.value)} placeholder="type to override" step="1" style={{background:"#f4f8ee",border:"1px solid #b8d09a",borderRadius:3,padding:"3px 7px",fontSize:11,fontFamily:"'IBM Plex Mono',monospace",color:"#1a3010",width:130,outline:"none"}}/></span>
                </label>)
              : inp("Total Revenue $",revenue,setRevenue,"$","","or enter manually")
            }
          </div>
          {inp("Total Expenses $",totalExpenses,setTotalExpenses,"$")}
        </div>

        {/* Live calc */}
        {(rev > 0 || exp > 0) && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20,padding:"12px",background:"#f4f8ee",borderRadius:6,border:"1px solid #ccdda0"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:9,color:"#7a9260",textTransform:"uppercase",letterSpacing:0.8,marginBottom:3}}>Revenue/Ac</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:14,color:"#1a6010",fontWeight:600}}>${f2(acres>0?rev/acres:0)}</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:9,color:"#7a9260",textTransform:"uppercase",letterSpacing:0.8,marginBottom:3}}>Exp/Ac</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:14,color:"#c05010",fontWeight:600}}>${f2(expPerAc)}</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:9,color:"#7a9260",textTransform:"uppercase",letterSpacing:0.8,marginBottom:3}}>Net Income</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:14,fontWeight:600,color:net>=0?"#1a6010":"#c02020"}}>{f$(net,true)}</div>
            </div>
          </div>
        )}

        <div style={{display:"flex",gap:10,justifyContent:"space-between",alignItems:"center"}}>
          {existingData && (
            <button onClick={()=>onSave(null)} style={{background:"#fff0f0",border:"1px solid #cc9090",borderRadius:5,padding:"8px 14px",fontSize:11,cursor:"pointer",color:"#c02020",fontFamily:"'Barlow',sans-serif"}}>
              Remove Data
            </button>
          )}
          <div style={{display:"flex",gap:10,marginLeft:"auto"}}>
            <button onClick={onClose} style={{background:"#fff",border:"1px solid #ccdda0",borderRadius:5,padding:"8px 18px",fontSize:12,cursor:"pointer",color:"#7a9260",fontFamily:"'Barlow',sans-serif"}}>Cancel</button>
            <button onClick={handleSave} style={{background:"#2a7a18",border:"none",borderRadius:5,padding:"8px 22px",fontSize:12,cursor:"pointer",color:"#fff",fontFamily:"'Barlow',sans-serif",fontWeight:600}}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldHistoryTab({ field, activeYear, allFields, years, createYear, switchYear, onUpdate, tenantId, manualHistory={}, onSaveHistory }) {
  const histEntry = useMemo(() => {
    // Primary: common|fieldNum
    const keyFn = field.common + '|' + field.fieldNum;
    if (HISTORY_DATA[keyFn]) return HISTORY_DATA[keyFn];
    // Secondary: common|legal (old format)
    const keyLegal = field.common + '|' + field.legal;
    if (HISTORY_DATA[keyLegal]) return HISTORY_DATA[keyLegal];
    // Fallback: match by common + fieldNum similarity
    const byCommon = Object.values(HISTORY_DATA).filter(d =>
      d.common.toLowerCase() === field.common.toLowerCase()
    );
    if (byCommon.length === 1) return byCommon[0];
    if (byCommon.length > 1) {
      const fnMatch = byCommon.find(d => d.fieldNum === field.fieldNum);
      if (fnMatch) return fnMatch;
      return byCommon.reduce((best, d) =>
        Math.abs(d.acres - field.acres) < Math.abs(best.acres - field.acres) ? d : best
      );
    }
    return null;
  }, [field.common, field.fieldNum, field.legal]);

  const suggestions = useMemo(() => getCropSuggestions(histEntry, activeYear), [histEntry, activeYear]);
  const HIST_YEARS_ALL = ["2015","2016","2017","2018","2019","2020","2021","2022","2023","2024","2025","2026"];

  // ── Manual history state ──────────────────────────────────────────────────
  const [manHist, setManHist] = useState({...manualHistory});
  const [addingYear, setAddingYear] = useState(false);
  const [newRow, setNewRow] = useState({year:"", crop:"", yield:"", acres:""});
  const [editingYear, setEditingYear] = useState(null);
  const [editRow, setEditRow] = useState({});
  useEffect(()=>{ setManHist({...manualHistory}); },[manualHistory]);

  const allEnteredYears = Object.keys(manHist).sort((a,b)=>b.localeCompare(a));

  const saveRow = (year, data) => {
    const updated = {...manHist, [year]: data};
    setManHist(updated);
    onSaveHistory && onSaveHistory(updated);
  };

  const deleteRow = year => {
    const updated = {...manHist};
    delete updated[year];
    setManHist(updated);
    onSaveHistory && onSaveHistory(updated);
  };

  const commitNew = () => {
    if(!newRow.year || !newRow.crop) return;
    saveRow(newRow.year, {crop:newRow.crop, yield:newRow.yield||"", acres:newRow.acres||""});
    setNewRow({year:"", crop:"", acres:""}); setAddingYear(false);
  };

  const commitEdit = () => {
    if(!editingYear) return;
    saveRow(editingYear, {crop:editRow.crop, yield:editRow.yield||"", acres:editRow.acres||""});
    setEditingYear(null);
  };

  const cropOpts = (_tenantCrops||ALL_CROPS);
  const inpS = {border:"1px solid #2a4030",borderRadius:4,padding:"4px 7px",fontSize:12,color:"#1a3010",fontFamily:"'Barlow',sans-serif",outline:"none",background:"#fff"};

  // Revenue modal state
  const [editYear, setEditYear] = useState(null);
  const [histRev, setHistRev] = useState(() => loadHistRevenue());

  const saveRev = (year, entry) => {
    const updated = { ...histRev };
    const key = getRevKey(field, year);
    if (entry === null) { delete updated[key]; }
    else { updated[key] = entry; }
    setHistRev(updated);
    saveHistRevenue(updated);
    setEditYear(null);
  };

  // Build financial data for each year
  const yearNetMap = useMemo(() => {
    const map = {};
    const fieldKey = field.common + '|' + field.fieldNum;

    // 1. Active year from live fields (highest priority)
    if (allFields) {
      const match = allFields.find(f => f.common === field.common && f.legal === field.legal && f.fieldNum === field.fieldNum)
      || allFields.find(f => f.common === field.common && f.legal === field.legal);
      if (match) {
        const c = calc(match);
        map[activeYear] = { net: c.net, revenue: c.revenue, expenses: c.expenses, expRate: c.expRate, crop: match.crop, source: 'plan' };
      }
    }
    // 2. Other AgriPlan years from localStorage
    for (const yr of HIST_YEARS_ALL) {
      if (yr === activeYear) continue;
      try {
        const raw = localStorage.getItem('agriplan_fields_' + yr);
        if (!raw) continue;
        const saved = JSON.parse(raw);
        const match = saved.find(f => f.common === field.common && f.legal === field.legal && f.fieldNum === field.fieldNum)
          || saved.find(f => f.common === field.common && f.legal === field.legal);
        if (match) {
          const c = calc(match);
          map[yr] = { net: c.net, revenue: c.revenue, expenses: c.expenses, expRate: c.expRate, crop: match.crop, source: 'plan' };
        }
      } catch {}
    }
    // 3. Workbook production data (col S × T) - fills in gaps
    // For workbook production, try fieldNum-specific key first then fall back
  const wbFieldKey2 = field.common + '|' + field.fieldNum;
  const wbField = WORKBOOK_PRODUCTION[fieldKey] || WORKBOOK_PRODUCTION[wbFieldKey2];
    if (wbField) {
      for (const yr of HIST_YEARS_ALL) {
        if (map[yr]) continue;
        const wd = wbField[yr];
        if (!wd) continue;
        const expRate = EXP.reduce((s,[k]) => {
          const cd = CROP_EXP_DEFAULTS[wd.crop];
          const _rates=_expRates||DEFAULT_RATES; const _crd=_cropRates||CROP_EXP_DEFAULTS; const _cd=_crd[field.crop]; return s + (_cd && _cd[k] !== undefined ? _cd[k] : _rates[k]??0);
        }, 0);
        const expenses = expRate * field.acres;
        const revenue = wd.revenue || 0;
        map[yr] = {
          revenue,
          expenses: revenue > 0 ? expenses : null,
          expRate: revenue > 0 ? expRate : null,
          net: revenue > 0 ? revenue - expenses : null,
          crop: wd.crop,
          bu_per_ac: wd.bu_per_ac,
          sold_price: wd.sold_price,
          total_bu: wd.total_bu,
          source: wd.revenue ? 'workbook' : 'workbook_yield',
        };
      }
    }
    // 4. Manually entered data - fills remaining gaps
    for (const yr of HIST_YEARS_ALL) {
      if (map[yr]) continue;
      const key = getRevKey(field, yr);
      if (histRev[key]) {
        const d = histRev[key];
        map[yr] = {
          net: d.revenue - d.totalExpenses,
          revenue: d.revenue,
          expenses: d.totalExpenses,
          expRate: field.acres > 0 ? d.totalExpenses / field.acres : 0,
          crop: d.crop,
          source: 'manual',
        };
      }
    }
    return map;
  }, [field.common, field.legal, activeYear, allFields, histRev]);

  const nextYear = String(+activeYear + 1);
  const hasCropData = histEntry && Object.keys(histEntry.history).length > 0;

  const handlePlant = (crop) => {
    const ny = nextYear;
    const yearExists = years && years.includes(ny);

    const applyToYear = () => {
      // Read the saved fields for nextYear from localStorage
      try {
        const raw = localStorage.getItem('agriplan_fields_' + ny);
        if (raw) {
          const savedFields = JSON.parse(raw);
          const match = savedFields.find(f => f.common === field.common && f.fieldNum === field.fieldNum)
                     || savedFields.find(f => f.common === field.common && Math.abs(f.acres - field.acres) < 1);
          if (match) {
            const updated = savedFields.map(f => f.id === match.id ? {...f, crop} : f);
            localStorage.setItem('agriplan_fields_' + ny, JSON.stringify(updated));
            fbSaveFields(ny, updated).catch(() => {});
          }
        }
      } catch(e) { console.warn('handlePlant error:', e); }
      switchYear && switchYear(ny);
    };

    if (!yearExists) {
      // Create the year as a copy of active year first, then apply
      createYear && createYear(ny, 'copy', activeYear);
      // createYear switches to the new year, so we wait a tick then update
      setTimeout(applyToYear, 600);
    } else {
      applyToYear();
    }
  };

  return (
    <div>
      {/* ── Manual crop history entry ───────────────────────────────────── */}
      {(tenantId || Object.keys(manHist).length > 0) && (
        <div style={{background:"#f6f9f0",border:"1px solid #c8e0a8",borderRadius:8,padding:16,marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontWeight:700,fontSize:13,color:"#1a4010"}}>📋 Crop History — {field.common}</div>
            {!addingYear&&<button onClick={()=>{setAddingYear(true);setNewRow({year:"",crop:"",yield:"",acres:String(field.acres||"")});}} style={{background:"#2a7a18",color:"#fff",border:"none",borderRadius:4,padding:"4px 14px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>+ Add Year</button>}
          </div>
          {allEnteredYears.length===0&&!addingYear&&<div style={{fontSize:12,color:"#9aaa80",textAlign:"center",padding:"12px 0"}}>No history entered yet — click + Add Year to start</div>}
          {(allEnteredYears.length>0||addingYear)&&(
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{background:"#1e3a18",color:"#c8e8a0"}}>
                {["Year","Crop","Yield (bu/ac)","Acres",""].map(h=><th key={h} style={{padding:"5px 8px",textAlign:"left",fontSize:10,letterSpacing:0.5}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {allEnteredYears.map((yr,i)=>(
                  editingYear===yr?(
                    <tr key={yr} style={{background:"#eaf5e0"}}>
                      <td style={{padding:"4px 6px",fontWeight:700,color:"#1a4010"}}>{yr}</td>
                      <td style={{padding:"4px 6px"}}><select value={editRow.crop||""} onChange={e=>setEditRow(p=>({...p,crop:e.target.value}))} style={{border:"1px solid #2a4030",borderRadius:4,padding:"4px 7px",fontSize:12,fontFamily:"'Barlow',sans-serif",outline:"none",width:"100%"}}><option value="">—</option>{cropOpts.map(c=><option key={c}>{c}</option>)}</select></td>
                      <td style={{padding:"4px 6px"}}><input type="number" value={editRow.yield||""} onChange={e=>setEditRow(p=>({...p,yield:e.target.value}))} style={{border:"1px solid #2a4030",borderRadius:4,padding:"4px 7px",fontSize:12,fontFamily:"'Barlow',sans-serif",outline:"none",width:70}}/></td>
                      <td style={{padding:"4px 6px"}}><input type="number" value={editRow.acres||""} onChange={e=>setEditRow(p=>({...p,acres:e.target.value}))} style={{border:"1px solid #2a4030",borderRadius:4,padding:"4px 7px",fontSize:12,fontFamily:"'Barlow',sans-serif",outline:"none",width:70}}/></td>
                      <td style={{padding:"4px 6px"}}><button onClick={commitEdit} style={{background:"#2a7a18",color:"#fff",border:"none",borderRadius:3,padding:"3px 10px",fontSize:11,cursor:"pointer",marginRight:4}}>✓</button><button onClick={()=>setEditingYear(null)} style={{background:"#f0f0f0",border:"1px solid #ccc",borderRadius:3,padding:"3px 8px",fontSize:11,cursor:"pointer"}}>✕</button></td>
                    </tr>
                  ):(
                    <tr key={yr} style={{background:i%2===0?"#f6f9f0":"#fff",borderBottom:"1px solid #e0eccc"}}>
                      <td style={{padding:"5px 8px",fontWeight:700,color:"#1a4010"}}>{yr}</td>
                      <td style={{padding:"5px 8px"}}><span style={{background:"#d4ecc0",padding:"1px 8px",borderRadius:3,fontSize:11,fontWeight:600,color:"#2a6010"}}>{manHist[yr].crop||"—"}</span></td>
                      <td style={{padding:"5px 8px",fontFamily:"'IBM Plex Mono',monospace"}}>{manHist[yr].yield||"—"}</td>
                      <td style={{padding:"5px 8px",fontFamily:"'IBM Plex Mono',monospace"}}>{manHist[yr].acres||"—"}</td>
                      <td style={{padding:"5px 8px"}}><button onClick={()=>{setEditingYear(yr);setEditRow({...manHist[yr]});}} style={{background:"none",border:"1px solid #5a9040",borderRadius:3,padding:"2px 8px",fontSize:10,cursor:"pointer",color:"#3a7020",marginRight:4}}>✏️</button><button onClick={()=>deleteRow(yr)} style={{background:"none",border:"1px solid #c04040",borderRadius:3,padding:"2px 8px",fontSize:10,cursor:"pointer",color:"#c04040"}}>✕</button></td>
                    </tr>
                  )
                ))}
                {addingYear&&(
                  <tr style={{background:"#eaf5e0"}}>
                    <td style={{padding:"4px 6px"}}><select value={newRow.year} onChange={e=>setNewRow(p=>({...p,year:e.target.value}))} style={{border:"1px solid #2a4030",borderRadius:4,padding:"4px 7px",fontSize:12,fontFamily:"'Barlow',sans-serif",outline:"none",width:"100%"}}><option value="">Year</option>{HIST_YEARS_ALL.filter(y=>!manHist[y]).map(y=><option key={y}>{y}</option>)}</select></td>
                    <td style={{padding:"4px 6px"}}><select value={newRow.crop} onChange={e=>setNewRow(p=>({...p,crop:e.target.value}))} style={{border:"1px solid #2a4030",borderRadius:4,padding:"4px 7px",fontSize:12,fontFamily:"'Barlow',sans-serif",outline:"none",width:"100%"}}><option value="">Crop</option>{cropOpts.map(c=><option key={c}>{c}</option>)}</select></td>
                    <td style={{padding:"4px 6px"}}><input type="number" placeholder="bu/ac" value={newRow.yield} onChange={e=>setNewRow(p=>({...p,yield:e.target.value}))} style={{border:"1px solid #2a4030",borderRadius:4,padding:"4px 7px",fontSize:12,fontFamily:"'Barlow',sans-serif",outline:"none",width:70}}/></td>
                    <td style={{padding:"4px 6px"}}><input type="number" placeholder="ac" value={newRow.acres} onChange={e=>setNewRow(p=>({...p,acres:e.target.value}))} style={{border:"1px solid #2a4030",borderRadius:4,padding:"4px 7px",fontSize:12,fontFamily:"'Barlow',sans-serif",outline:"none",width:70}}/></td>
                    <td style={{padding:"4px 6px"}}><button onClick={commitNew} disabled={!newRow.year||!newRow.crop} style={{background:(!newRow.year||!newRow.crop)?"#aac890":"#2a7a18",color:"#fff",border:"none",borderRadius:3,padding:"3px 10px",fontSize:11,cursor:"pointer",marginRight:4}}>✓ Add</button><button onClick={()=>setAddingYear(false)} style={{background:"#f0f0f0",border:"1px solid #ccc",borderRadius:3,padding:"3px 8px",fontSize:11,cursor:"pointer"}}>✕</button></td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          {allEnteredYears.length>0&&<div style={{fontSize:10,color:"#9aaa80",marginTop:8}}>History is used for rotation planning and crop suggestions. Yield and acres are optional.</div>}
        </div>
      )}

      {/* Revenue Input Modal */}
      {editYear && (
        <RevenueInputModal
          field={field}
          year={editYear}
          crop={yearNetMap[editYear]?.crop || histEntry?.history[editYear] || ''}
          existingData={histRev[getRevKey(field, editYear)] || null}
          onSave={entry => saveRev(editYear, entry)}
          onClose={() => setEditYear(null)}
        />
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:20,alignItems:"start"}}>
        {/* History table */}
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:600,color:"#3a6020",textTransform:"uppercase",letterSpacing:0.8}}>
              Crop & Revenue History — {field.common}
            </div>
            <div style={{fontSize:10,color:"#7a9260",fontStyle:"italic"}}>Click ✏ to enter revenue for any year</div>
          </div>

          {!hasCropData && (
            <div style={{padding:"16px",background:"#f8fbf5",border:"1px solid #ccdda0",borderRadius:6,color:"#7a9260",fontSize:12}}>
              No crop history found for this field in the workbook data.
            </div>
          )}

          {hasCropData && (
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr>
                  <th style={{padding:"5px 10px",background:"#1e3a18",color:"#c8e8a0",fontSize:9,textTransform:"uppercase",letterSpacing:0.6,textAlign:"left",width:55}}>Year</th>
                  <th style={{padding:"5px 10px",background:"#1e3a18",color:"#c8e8a0",fontSize:9,textTransform:"uppercase",letterSpacing:0.6,textAlign:"left"}}>Crop</th>
                  <th style={{padding:"5px 10px",background:"#1e3a18",color:"#c8e8a0",fontSize:9,textTransform:"uppercase",letterSpacing:0.6,textAlign:"right"}}>Revenue</th>
                  <th style={{padding:"5px 10px",background:"#1e3a18",color:"#c8e8a0",fontSize:9,textTransform:"uppercase",letterSpacing:0.6,textAlign:"right"}}>Exp $/ac</th>
                  <th style={{padding:"5px 10px",background:"#1e3a18",color:"#c8e8a0",fontSize:9,textTransform:"uppercase",letterSpacing:0.6,textAlign:"right"}}>Net Income</th>
                  <th style={{padding:"5px 4px",background:"#1e3a18",color:"#c8e8a0",fontSize:9,textAlign:"center",width:32}}></th>
                </tr>
              </thead>
              <tbody>
                {HIST_YEARS_ALL.map((yr,i) => {
                  const histCrop = histEntry?.history[yr];
                  const fin = yearNetMap[yr];
                  const isActive = yr === activeYear;
                  const cropToShow = fin?.crop || histCrop;
                  const isManual = fin?.source === 'manual';

                  if (!cropToShow && !fin) return (
                    <tr key={yr} style={{background:i%2===0?"#f6f9f0":"#fff"}}>
                      <td style={{padding:"4px 10px",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"#b0c0a0",borderBottom:"1px solid #eef4e8"}}>{yr}</td>
                      <td colSpan={4} style={{padding:"4px 10px",color:"#c0cdb0",fontSize:10,borderBottom:"1px solid #eef4e8"}}>No data</td>
                      <td style={{padding:"4px 4px",borderBottom:"1px solid #eef4e8",textAlign:"center"}}>
                        <button onClick={()=>setEditYear(yr)} title="Enter revenue data"
                          style={{background:"none",border:"1px solid #c8dda0",borderRadius:3,padding:"2px 5px",fontSize:10,cursor:"pointer",color:"#7a9260"}}>✏</button>
                      </td>
                    </tr>
                  );

                  return (
                    <tr key={yr} style={{background:isActive?"#e8f8d8":i%2===0?"#f6f9f0":"#fff",borderLeft:isActive?"3px solid #3a9020":"3px solid transparent"}}>
                      <td style={{padding:"5px 10px",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:isActive?700:400,color:isActive?"#1a5010":"#527a38",borderBottom:"1px solid #e0eccc"}}>
                        {yr}{isActive&&<span style={{fontSize:8,marginLeft:3,color:"#3a9020"}}>▶</span>}
                      </td>
                      <td style={{padding:"5px 10px",borderBottom:"1px solid #e0eccc"}}>
                        {cropToShow
                          ? <span style={{background:cropColor(cropToShow),color:"#fff",padding:"1px 7px",borderRadius:3,fontSize:10,fontWeight:600}}>{cropToShow}</span>
                          : <span style={{color:"#ccc",fontSize:10}}>—</span>}
                      </td>
                      <td style={{padding:"5px 10px",textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,borderBottom:"1px solid #e0eccc",color:fin?"#1a5010":"#b0c0a0"}}>
                        {fin && fin.revenue > 0 ? (
                          <div>
                            <div>{f$(fin.revenue)}
                              {isManual&&<span style={{fontSize:8,color:"#7a9260",marginLeft:3}}>M</span>}
                              {fin.source==="workbook"&&<span style={{fontSize:8,color:"#3a7a50",marginLeft:3}}>W</span>}
                            </div>
                            {fin.bu_per_ac&&<div style={{fontSize:8,color:"#7a9a70"}}>{fin.bu_per_ac.toFixed(1)}bu/ac{fin.sold_price?` × $${fin.sold_price}`:""}</div>}
                          </div>
                        ) : fin && fin.bu_per_ac ? (
                          <div>
                            <div style={{color:"#b0c0a0"}}>no price</div>
                            <div style={{fontSize:8,color:"#7a9a70"}}>{fin.bu_per_ac.toFixed(1)} bu/ac</div>
                          </div>
                        ) : "—"}
                      </td>
                      <td style={{padding:"5px 10px",textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:fin?"#8a5030":"#b0c0a0",borderBottom:"1px solid #e0eccc"}}>
                        {fin ? "$"+f2(fin.expRate) : "—"}
                      </td>
                      <td style={{padding:"5px 10px",textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:fin?600:400,borderBottom:"1px solid #e0eccc",color:!fin?"#b0c0a0":fin.net>=0?"#1a6010":"#c02020"}}>
                        {fin ? f$(fin.net,true) : "—"}
                      </td>
                      <td style={{padding:"5px 4px",borderBottom:"1px solid #e0eccc",textAlign:"center"}}>
                        {!isActive && (
                          <button onClick={()=>setEditYear(yr)} title={isManual?"Edit revenue data":"Enter revenue data"}
                            style={{background:isManual?"#e8f8e0":"none",border:`1px solid ${isManual?"#88c870":"#c8dda0"}`,borderRadius:3,padding:"2px 5px",fontSize:10,cursor:"pointer",color:isManual?"#2a7010":"#7a9260"}}>
                            {isManual?"✓":"✏"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div style={{fontSize:10,color:"#8a9a70",marginTop:6,display:"flex",gap:12}}>
            <span>📋 Crop history from workbook</span>
            <span>💰 Plan data · <span style={{color:"#3a7a50"}}>W = Workbook (col S×T)</span></span>
            <span style={{color:"#2a7010"}}>M = Manually entered</span>
            <span>✏ = Click to add revenue</span>
          </div>
        </div>

        {/* Crop Suggestions */}
        <div style={{background:"#fff",border:"1px solid #ccdda0",borderRadius:8,padding:"18px"}}>
          <div style={{fontSize:15,fontWeight:700,color:"#2a5a18",marginBottom:4}}>
            {nextYear} Crop Suggestions
          </div>
          <div style={{fontSize:12,color:"#7a9260",marginBottom:12}}>
            Profitability based on your actual APH where available, typical values otherwise
          </div>


          {/* Eligible crops with profitability */}
          <div style={{fontSize:12,color:"#3a7020",textTransform:"uppercase",letterSpacing:0.7,marginBottom:8,fontWeight:700}}>✓ Rotation Eligible</div>
          {suggestions.filter(s=>s.eligible).map(s=>{
            const p = getCropProfitability(s.crop, field.acres, field.common);
            return(
            <div key={s.crop} style={{marginBottom:10,padding:"11px 13px",background:"#f4fcee",borderRadius:6,border:"1px solid #cce8b0"}}>
              {/* Crop name + last grown + plant button */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6,gap:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
                  <span style={{background:cropColor(s.crop),color:"#fff",padding:"4px 12px",borderRadius:4,fontSize:13,fontWeight:700,flexShrink:0}}>{s.crop}</span>
                  <span style={{fontSize:11,color:"#8a9a70",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.lastUsed?`Last: ${s.lastUsed}`:"No prior history"}</span>
                </div>
                <button onClick={()=>handlePlant(s.crop)}
                  style={{background:"#2a7a18",border:"none",borderRadius:5,padding:"5px 12px",fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                  ✓ Plant {nextYear}
                </button>
              </div>
              {p && (<>
                {/* Guarantee row */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:4}}>
                  <div style={{background:"#e8f4d8",borderRadius:3,padding:"4px 7px"}}>
                    <div style={{fontSize:10,color:"#527a38",textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>🛡 Ins. Guarantee Net</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:16,fontWeight:700,color:p.guarNet>=0?"#1a6010":"#c02020"}}>
                      {f$(p.guarNet,true)}
                    </div>
                    <div style={{fontSize:10,color:p.fieldAph?"#2a7010":"#8a9a70",fontWeight:p.fieldAph?600:400}}>${f2(p.guarNetPerAc)}/ac · {p.aphNote}</div>
                  </div>
                  <div style={{background:"#f0f8e8",borderRadius:3,padding:"4px 7px"}}>
                    <div style={{fontSize:10,color:"#527a38",textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>📈 Projected Net</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:16,fontWeight:700,color:p.projNet>=0?"#1a6010":"#c02020"}}>
                      {f$(p.projNet,true)}
                    </div>
                    <div style={{fontSize:10,color:p.fieldAph?"#2a7010":"#8a9a70",fontWeight:p.fieldAph?600:400}}>${f2(p.projNetPerAc)}/ac · {p.fieldAph?"Your APH":"Typical"} @ ${f2(p.soldPrice)}/bu sold</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  <div style={{background:"#fff0e8",borderRadius:5,padding:"8px 12px",flex:1,textAlign:"center"}}>
                    <div style={{fontSize:10,color:"#8a5030",textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>Est. Expenses</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:16,fontWeight:700,color:"#c05010"}}>${f2(p.expRate)}/ac</div>
                  </div>
                  <div style={{background:"#e8f4e0",borderRadius:5,padding:"8px 12px",flex:1,textAlign:"center"}}>
                    <div style={{fontSize:10,color:"#3a6020",textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>Guar Revenue</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:16,fontWeight:700,color:"#2a7010"}}>${f2(p.guarRevPerAc)}/ac</div>
                  </div>
                </div>
              </>)}
            </div>
          );})}

          {/* Ineligible */}
          <div style={{fontSize:12,color:"#904040",textTransform:"uppercase",letterSpacing:0.7,marginBottom:8,fontWeight:700,marginTop:16}}>✗ Rotation Conflict</div>
          {suggestions.filter(s=>!s.eligible).map(s=>(
            <div key={s.crop} style={{marginBottom:6,padding:"9px 11px",background:"#fff8f0",borderRadius:5,border:"1px solid #f0c090"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}>
                <span style={{background:cropColor(s.crop),color:"#fff",padding:"3px 10px",borderRadius:3,fontSize:12,fontWeight:600,opacity:0.6}}>{s.crop}</span>
              </div>
              {s.violations.map((v,i)=><div key={i} style={{fontSize:11,color:"#c05010",marginTop:3}}>• {v}</div>)}
            </div>
          ))}
          <div style={{fontSize:10,color:"#b0b8a8",marginTop:12,fontStyle:"italic",lineHeight:1.5}}>
            Profitability uses imported APH or entered history. Actual guarantees depend on your policy and field APH. Expenses from configured rates.
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Field Detail ─────────────────────────────────────────────────────────────
function FieldDetail({field,onUpdateIncome,onUpdateExpense,onResetExpense,onUpdate,onDelete,activeYear,allFields,years,createYear,switchYear,fieldRestrictions={},tenantId,token,fieldHistory={},flSeedLogs={},onSaveFieldHistory}){
  // ── Chemical plantback warnings ────────────────────────────────────────────
  const chemWarnings = useMemo(() => {
    if(!field.crop || !fieldRestrictions) return [];
    const safeKey = field.common.replace(/[.#$[\]\/]/g, '_').replace(/\s+/g, '_');
    const fieldData = fieldRestrictions[safeKey];
    if(!fieldData?.chemicals) return [];
    const today = Date.now();
    const warnings = [];
    for(const [chemName, {date, plantback}] of Object.entries(fieldData.chemicals)) {
      // Normalize crop names for lookup (e.g. "Spring Wheat" vs "Wheat")
      const days = plantback[field.crop]
        ?? plantback[field.crop.replace("Spring ","").replace("Winter ","").replace("CC ","")]
        ?? null;
      if(!days) continue;
      const daysAgo = Math.floor((today - new Date(date).getTime()) / 86400000);
      const daysRemaining = days - daysAgo;
      if(daysRemaining > 0) {
        const appliedDate = new Date(date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
        warnings.push({ chemName, daysAgo, daysRemaining, appliedDate, totalDays: days });
      }
    }
    return warnings.sort((a,b) => b.daysRemaining - a.daysRemaining);
  }, [field.crop, field.common, fieldRestrictions]);
  const[tab,setTab]=useState("income");
  const[priorYear,setPriorYear]=useState("2023 Actuals");
  const[editing,setEditing]=useState(false);
  const[editDraft,setEditDraft]=useState({});
  const c=calc(field);const priorRates=YEAR_LABELS[priorYear];
  const TB=(t,l)=>(<button onClick={()=>setTab(t)} style={{padding:"8px 18px",fontSize:11,cursor:"pointer",border:"none",background:"none",color:tab===t?"#1a7010":"#6a8a50",borderBottom:tab===t?"2px solid #5cb850":"2px solid transparent",fontFamily:"'Barlow',sans-serif",textTransform:"uppercase",letterSpacing:0.8}}>{l}</button>);

  return(<div>
    {/* Header */}
    {editing ? (
      <div style={{background:"#f6fbf0",border:"2px solid #5cb850",borderRadius:10,padding:20,marginBottom:18}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:"#1a4010",marginBottom:14}}>✏️ Edit Field Info</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
          {[["Entity","entity"],["Farm / Landlord","farm"],["Farm Number","farmNumber"]].map(([lbl,key])=>(
            <label key={key} style={{display:"flex",flexDirection:"column",gap:3}}>
              <span style={{fontSize:10,color:"#527a38",textTransform:"uppercase",letterSpacing:0.8}}>{lbl}</span>
              <input value={editDraft[key]??""} onChange={e=>setEditDraft(p=>({...p,[key]:e.target.value}))}
                style={{background:"#fff",border:"1px solid #2a4030",borderRadius:4,padding:"6px 9px",fontSize:13,color:"#1a3010",fontFamily:"'Barlow',sans-serif",outline:"none"}}/>
            </label>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
          {[["Legal Description","legal"],["Common Name *","common"],["Field Number(s)","fieldNum"]].map(([lbl,key])=>(
            <label key={key} style={{display:"flex",flexDirection:"column",gap:3}}>
              <span style={{fontSize:10,color:"#527a38",textTransform:"uppercase",letterSpacing:0.8}}>{lbl}</span>
              <input value={editDraft[key]??""} onChange={e=>setEditDraft(p=>({...p,[key]:e.target.value}))}
                style={{background:"#fff",border:"1px solid #2a4030",borderRadius:4,padding:"6px 9px",fontSize:13,color:"#1a3010",fontFamily:"'Barlow',sans-serif",outline:"none"}}/>
            </label>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"120px 1fr",gap:10,marginBottom:16,alignItems:"end"}}>
          <label style={{display:"flex",flexDirection:"column",gap:3}}>
            <span style={{fontSize:10,color:"#527a38",textTransform:"uppercase",letterSpacing:0.8}}>Acres *</span>
            <input type="number" value={editDraft.acres??""} onChange={e=>setEditDraft(p=>({...p,acres:e.target.value}))}
              style={{background:"#fff",border:"1px solid #2a4030",borderRadius:4,padding:"6px 9px",fontSize:13,color:"#1a3010",fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}/>
          </label>
          <div/>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={()=>setEditing(false)}
            style={{background:"#fff0f0",border:"1px solid #4a2020",borderRadius:4,padding:"6px 16px",color:"#c02020",fontSize:12,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>Cancel</button>
          <button onClick={()=>{
            if(!editDraft.common?.trim()||!editDraft.acres) return alert("Name and acres are required.");
            onUpdate(field.id,{...editDraft,acres:+editDraft.acres});
            setEditing(false);
          }} style={{background:"#2a7a18",border:"none",borderRadius:4,padding:"6px 18px",color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontWeight:700}}>Save Changes</button>
        </div>
      </div>
    ) : (
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:18}}>
      <div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"#1a3010"}}>{field.common}{field.fieldNum&&<span style={{fontSize:14,color:"#6a8a50"}}> — Field #{field.fieldNum}</span>}</div>
        <div style={{fontSize:12,color:"#6a8a50",marginTop:2}}>
          <span style={{background:"#d4ecc0",padding:"1px 7px",borderRadius:3,fontSize:10,color:"#2a7010",marginRight:6}}>{field.entity}</span>
          {field.farm} · {field.legal||"—"} · {field.acres.toLocaleString()} ac
        </div>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <CropSelect value={field.crop} onChange={v=>onUpdate(field.id,{crop:v})} eligibleCrops={field.eligibleCrops}/>
        <button onClick={()=>{setEditDraft({entity:field.entity||"",farm:field.farm||"",farmNumber:field.farmNumber||"",legal:field.legal||"",common:field.common||"",fieldNum:field.fieldNum||"",acres:field.acres||""});setEditing(true);}}
          style={{background:"#f0f8e8",border:"1px solid #4a8030",borderRadius:4,padding:"6px 10px",color:"#2a6010",fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>✏️ Edit</button>
        <button onClick={()=>{if(window.confirm("Delete this field?"))onDelete(field.id);}} style={{background:"#fff0f0",border:"1px solid #4a2020",borderRadius:4,padding:"6px 10px",color:"#c02020",fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>Delete</button>
      </div>
    </div>
    )}
    {/* Summary */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
      <SCard label="Ins. Guarantee" val={f$(c.guarantee)} color="#7a6010" sub={`$${f2(c.valAcre)}/ac`}/>
      <SCard label="Projected Revenue" val={f$(c.revenue)} color="#1a7010" sub={`${f2(field.income.bushelProjection)} bu × $${f2(field.income.currentPrice)}`}/>
      <SCard label="Upside / Risk" val={f$(c.risk,true)} color={c.risk>=0?"#1a7010":"#c02020"} sub="vs. guarantee"/>
      <SCard label="Total Expenses" val={f$(c.expenses)} color="#c05010" sub={`$${f2(c.expRate)}/ac`}/>
      <SCard label="Net Income" val={f$(c.net,true)} color={c.net>=0?"#1a7010":"#c02020"} sub="rev − expenses"/>
    </div>
    {/* Chemical plantback warnings */}
    {chemWarnings.length > 0 && (
      <div style={{background:"#fff8e0",border:"2px solid #c07010",borderRadius:8,padding:"12px 16px",marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:700,color:"#7a4a00",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
          ⚗️ Chemical Plantback Restrictions — <span style={{fontWeight:400}}>{field.crop} cannot be planted yet on this field</span>
        </div>
        {chemWarnings.map(w=>(
          <div key={w.chemName} style={{display:"flex",alignItems:"baseline",gap:8,fontSize:11,color:"#5a3800",padding:"4px 0",borderTop:"1px solid #e0c060"}}>
            <span style={{fontSize:14}}>🚫</span>
            <div style={{flex:1}}>
              <strong>{w.chemName}</strong> — applied {w.appliedDate} ({w.daysAgo} days ago)
              <span style={{marginLeft:8,background:"#c07010",color:"#fff",borderRadius:3,padding:"1px 7px",fontSize:10,fontWeight:700}}>
                {w.daysRemaining} days remaining
              </span>
              <span style={{marginLeft:6,color:"#9a7020",fontSize:10}}>({w.totalDays}-day plantback for {field.crop})</span>
            </div>
          </div>
        ))}
        <div style={{fontSize:10,color:"#9a7020",marginTop:8,paddingTop:6,borderTop:"1px solid #e0c060"}}>
          ⚠️ Spraying data from FieldLog. Verify with your agronomist before planting.
        </div>
      </div>
    )}
    {/* ── Seeding Log from AgriField ───────────────────────────────── */}
    <SeedLogSection fieldName={field.common} plannedCrop={field.crop} logs={(flSeedLogs||{})[field.common]||[]} tenantId={tenantId}/>

    {/* Tabs */}
    <div style={{borderBottom:"1px solid #1e3020",marginBottom:20}}>{TB("income","Income")}{TB("expenses","Expenses")}{TB("eligibility","Crop Eligibility")}{TB("history","📋 History & Plan")}</div>

    {/* Income Tab */}
    {tab==="income"&&(<div>
      <div style={{display:"grid",gridTemplateColumns:"200px 140px 1fr 140px",gap:12,padding:"6px 0",borderBottom:"1px solid #1a2a1a",marginBottom:4}}>
        {["","Per Acre","Calculation","Total"].map((h,i)=>(<div key={i} style={{fontSize:10,color:"#7a9260",textTransform:"uppercase",letterSpacing:0.8,textAlign:i>1?"right":"left"}}>{h}</div>))}
      </div>
      {[["Bushel Guarantee","bushelGuarantee","bu",field.income.bushelGuarantee,v=>`${v} bu × $${f2(field.income.priceGuarantee)} = $${f2(v*field.income.priceGuarantee)}/ac`,f$(c.guarantee)],
        ["Price Guarantee","priceGuarantee","$",field.income.priceGuarantee,v=>`Guarantee: $${f2(field.income.bushelGuarantee*v)}/ac`,""],
        ["Bushel Projection","bushelProjection","bu",field.income.bushelProjection,v=>`${v} bu × $${f2(field.income.currentPrice)} = $${f2(v*field.income.currentPrice)}/ac`,f$(c.revenue)],
        ["Projected Price","currentPrice","$",field.income.currentPrice,v=>`Revenue: $${f2(field.income.bushelProjection*v)}/ac`,""],
      ].map(([label,key,unit,val,desc,total])=>(<div key={key} style={{display:"grid",gridTemplateColumns:"200px 140px 1fr 140px",gap:12,alignItems:"center",padding:"8px 0",borderBottom:"1px solid #121e12"}}>
        <div style={{fontSize:12,color:"#5a7a48"}}>{label}</div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {unit==="$"&&<span style={{color:"#4a8a30",fontSize:12}}>$</span>}
          <input type="number" value={val} step="0.01" onChange={e=>onUpdateIncome(field.id,key,e.target.value)}
            style={{background:"#ffffff",border:"1px solid #1e3020",borderRadius:4,padding:"5px 8px",color:"#1a4010",fontFamily:"'IBM Plex Mono',monospace",fontSize:13,width:unit==="$"?90:80,outline:"none"}}/>
          {unit==="bu"&&<span style={{color:"#4a8a30",fontSize:12}}>bu</span>}
        </div>
        <div style={{fontSize:11,color:"#7a9260",fontFamily:"'IBM Plex Mono',monospace"}}>{desc(val)}</div>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:"#1a7010",textAlign:"right"}}>{total}</div>
      </div>))}
    </div>)}

    {/* Expenses Tab */}
    {tab==="expenses"&&(<div>
      {/* Prior year toggle */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,padding:"8px 12px",background:"#ffffff",borderRadius:6,border:"1px solid #1e3020"}}>
        <span style={{fontSize:10,color:"#527a38",textTransform:"uppercase",letterSpacing:0.8}}>Compare to:</span>
        {Object.keys(YEAR_LABELS).map(yr=>(<button key={yr} onClick={()=>setPriorYear(yr)} style={{background:priorYear===yr?"#2a7a18":"transparent",border:"1px solid #2a4030",borderRadius:3,padding:"4px 10px",color:priorYear===yr?"#ffffff":"#6a8a50",fontSize:10,fontWeight:priorYear===yr?700:400,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>{yr}</button>))}
        <span style={{marginLeft:"auto",fontSize:10}}>
          <span style={{background:"#e8f4e0",padding:"2px 8px",borderRadius:3,color:"#1a5010",fontWeight:600,marginRight:6}}>● Crop Default</span>
          <span style={{background:"#f4ecd8",padding:"2px 8px",borderRadius:3,color:"#7a4a10",fontWeight:600}}>★ Field Override</span>
        </span>
      </div>
      {/* Column headers */}
      <div style={{display:"grid",gridTemplateColumns:"220px 110px 110px 110px 1fr 110px",gap:8,padding:"5px 0",borderBottom:"1px solid #1a2a1a",marginBottom:4}}>
        {["Category","2026 $/Ac","Crop Default","Prior Year","vs Prior Yr","Total $"].map((h,i)=>(<div key={i} style={{fontSize:9,color:"#7a9260",textTransform:"uppercase",letterSpacing:0.8,textAlign:i>0?"right":"left"}}>{h}</div>))}
      </div>
      {EXP.map(([key,label])=>{
        const rate=getRate(field,key);const cropDef=getCropDefault(field.crop,key);
        const isOv=field.expenseOverrides&&field.expenseOverrides[key]!==undefined;
        const prior=priorRates[key];const chg=rate-prior;const tot=rate*field.acres;
        return(<div key={key} style={{display:"grid",gridTemplateColumns:"220px 110px 110px 110px 1fr 110px",gap:8,alignItems:"center",padding:"5px 0",borderBottom:"1px solid #0f1a0f",background:isOv?"#fffcf0":"transparent"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:isOv?"#9a6010":"#5a7a48"}}>
            <span style={{fontSize:9}}>{isOv?"★":"●"}</span>{label}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:3,justifyContent:"flex-end"}}>
            <span style={{color:"#4a8a30",fontSize:11}}>$</span>
            <input type="number" value={rate} step="0.01" onChange={e=>onUpdateExpense(field.id,key,e.target.value)}
              style={{background:"#ffffff",border:`1px solid ${isOv?"#cc9400":"#b8d09a"}`,borderRadius:4,padding:"4px 6px",color:isOv?"#9a6010":"#c05010",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,width:72,outline:"none",textAlign:"right"}}/>
          </div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"#6a8a50",textAlign:"right",display:"flex",alignItems:"center",justifyContent:"flex-end",gap:4}}>
            ${f2(cropDef)}
            {isOv&&(<button onClick={()=>onResetExpense(field.id,key)} title="Reset to crop default" style={{background:"#fff3d4",border:"1px solid #4a3010",borderRadius:3,padding:"1px 5px",color:"#8a6010",fontSize:9,cursor:"pointer"}}>↺</button>)}
          </div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"#7a9260",textAlign:"right"}}>${f2(prior)}</div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,textAlign:"right",color:chg>0?"#c02020":chg<0?"#1a7010":"#6a8a50"}}>{chg>0?"+":""}{f2(chg)} ({chg>0?"+":""}{prior>0?(chg/prior*100).toFixed(1):0}%)</div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"#8a5030",textAlign:"right"}}>{f$(tot)}</div>
        </div>);
      })}
      <div style={{display:"grid",gridTemplateColumns:"220px 110px 110px 110px 1fr 110px",gap:8,alignItems:"center",padding:"9px 0",borderTop:"2px solid #2a4030",marginTop:4}}>
        <div style={{fontSize:12,color:"#3a5a28",fontWeight:600}}>TOTAL EXPENSES</div>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"#c05010",textAlign:"right"}}>${f2(c.expRate)}/ac</div>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"#6a8a50",textAlign:"right"}}>${f2(EXP.reduce((s,[k])=>s+getCropDefault(field.crop,k),0))}/ac</div>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"#7a9260",textAlign:"right"}}>${f2(Object.values(priorRates).reduce((s,v)=>s+v,0))}/ac</div>
        <div></div>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:14,color:"#c05010",textAlign:"right",fontWeight:600}}>{f$(c.expenses)}</div>
      </div>
    </div>)}

    {/* Eligibility Tab */}
    {tab==="eligibility"&&(<div>
      <p style={{fontSize:12,color:"#5a7a40",marginBottom:16}}>Toggle crops with APH history on this field. Unchecked crops show <span style={{color:"#c02020"}}>red</span> and cannot be planted.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
        {(_tenantCrops||ALL_CROPS).filter(c=>!(_globallyIneligible||GLOBALLY_INELIGIBLE).has(c)).map(c=>{
          // Normalize eligibleCrops — Firebase may return array or plain object
          const _raw=field.eligibleCrops;
          const _ec=Array.isArray(_raw)?_raw:_raw&&typeof _raw==="object"?Object.values(_raw):(_tenantCrops||ALL_CROPS);
          const on=_ec.includes(c);
          return(<label key={c} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:on?"#e8f8e0":"#fdf4f4",border:`1px solid ${on?"#2a7a18":"#ddb0b0"}`,borderRadius:5,cursor:"pointer",fontSize:12,color:on?"#1a7010":"#904040"}}>
          <input type="checkbox" checked={on} onChange={()=>{ onUpdate(field.id,{eligibleCrops:on?_ec.filter(x=>x!==c):[..._ec,c]}); }} style={{accentColor:"#3a9020"}}/>
          <span style={{width:8,height:8,borderRadius:"50%",background:on?"#3a9020":"#7a3030",flexShrink:0}}/>{c}
        </label>);})}
      </div>
      <div style={{padding:"12px 14px",background:"#fdf4f4",borderRadius:6,border:"1px solid #2a1a1a"}}>
        <div style={{fontSize:10,color:"#904040",textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>Always Ineligible (Region/Policy)</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{[...(_globallyIneligible||GLOBALLY_INELIGIBLE)].map(c=>(<span key={c} style={{padding:"3px 10px",background:"#fff0f0",border:"1px solid #4a2020",borderRadius:3,fontSize:11,color:"#904040"}}>{c}</span>))}</div>
      </div>

    </div>)}
    {tab==="history"&&(<FieldHistoryTab field={field} activeYear={activeYear||"2026"} allFields={allFields} years={years} createYear={createYear} switchYear={switchYear} onUpdate={onUpdate} tenantId={tenantId} manualHistory={fieldHistory[field.common]||{}} onSaveHistory={hist=>onSaveFieldHistory&&onSaveFieldHistory(field.common,hist)}/>)}
  </div>);
}

// ── Add Field Form ────────────────────────────────────────────────────────────
function AddFieldForm({onSave,onCancel}){
  const[d,setD]=useState({farmNumber:"",entity:"",farm:"",legal:"",common:"",fieldNum:"",acres:"",crop:"Spring Wheat",bushelGuarantee:25,priceGuarantee:6.25,bushelProjection:25,currentPrice:6.25});
  const[eligibleCrops,setEligibleCrops]=useState(_isAgriLogixTenant?[...(_tenantCrops||ALL_CROPS)]:[...FA_ELIG]);
  const upd=(k,v)=>setD(p=>({...p,[k]:v}));
  const inp=(label,key,type="text")=>(<label style={{display:"flex",flexDirection:"column",gap:4}}>
    <span style={{fontSize:10,color:"#527a38",textTransform:"uppercase",letterSpacing:0.8}}>{label}</span>
    <input type={type} value={d[key]} onChange={e=>upd(key,e.target.value)} style={{background:"#ffffff",border:"1px solid #2a4030",borderRadius:4,padding:"7px 10px",color:"#1a3010",fontFamily:type==="number"?"'IBM Plex Mono',monospace":"'Barlow',sans-serif",fontSize:13,outline:"none"}}/>
  </label>);
  return(<div style={{background:"#ffffff",border:"1px solid #ccdda0",borderRadius:10,padding:24,maxWidth:900}}>
    <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#1a4010",marginBottom:20}}>Add New Field</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
      <label style={{display:"flex",flexDirection:"column",gap:4}}><span style={{fontSize:10,color:"#527a38",textTransform:"uppercase",letterSpacing:0.8}}>Entity</span>
        <input value={d.entity} onChange={e=>upd("entity",e.target.value)} placeholder="e.g. Agri Logix" style={{background:"#ffffff",border:"1px solid #2a4030",borderRadius:4,padding:"7px 10px",color:"#1a3010",fontFamily:"'Barlow',sans-serif",fontSize:13,outline:"none",width:"100%"}}/>
      </label>
      {inp("Farm / Landlord","farm")}{inp("Farm Number","farmNumber")}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>{inp("Legal Description","legal")}{inp("Common Name *","common")}{inp("Field Number(s)","fieldNum")}</div>
    <div style={{display:"grid",gridTemplateColumns:"120px 1fr",gap:12,marginBottom:12,alignItems:"end"}}>
      {inp("Acres *","acres","number")}
      <label style={{display:"flex",flexDirection:"column",gap:4}}><span style={{fontSize:10,color:"#527a38",textTransform:"uppercase",letterSpacing:0.8}}>Crop *</span><CropSelect value={d.crop} onChange={v=>upd("crop",v)} eligibleCrops={eligibleCrops}/></label>
    </div>
    <div style={{fontSize:11,color:"#527a38",marginBottom:8,textTransform:"uppercase",letterSpacing:0.8}}>— Income Projections ──────────────────────────────</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:16}}>{inp("Bu Guarantee/Ac","bushelGuarantee","number")}{inp("Guarantee Price","priceGuarantee","number")}{inp("Bu Projection/Ac","bushelProjection","number")}{inp("Projected Price","currentPrice","number")}</div>
    <div style={{fontSize:11,color:"#527a38",marginBottom:8,textTransform:"uppercase",letterSpacing:0.8}}>— Crop Insurance Eligibility ────────────────────</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginBottom:16}}>
      {(_tenantCrops||ALL_CROPS).filter(c=>!(_globallyIneligible||GLOBALLY_INELIGIBLE).has(c)).map(c=>{const on=(eligibleCrops||[]).includes(c);return(<label key={c} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",background:on?"#e8f8e0":"#fdf4f4",border:`1px solid ${on?"#2a7a18":"#ddb0b0"}`,borderRadius:4,cursor:"pointer",fontSize:11,color:on?"#1a7010":"#904040"}}>
        <input type="checkbox" checked={on} onChange={()=>setEligibleCrops(p=>on?p.filter(x=>x!==c):[...p,c])} style={{accentColor:"#3a9020"}}/>{c}
      </label>);})}
    </div>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
      <button onClick={onCancel} style={{background:"#fff0f0",border:"1px solid #4a2020",borderRadius:4,padding:"7px 16px",color:"#c02020",fontSize:12,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>Cancel</button>
      <button onClick={()=>{if(!d.common||!d.acres||!d.crop)return alert("Name, acres, and crop required.");onSave({...d,acres:+d.acres,income:{bushelGuarantee:+d.bushelGuarantee,priceGuarantee:+d.priceGuarantee,bushelProjection:+d.bushelProjection,currentPrice:+d.currentPrice},eligibleCrops,expenseOverrides:{}});}} style={{background:"#2a7a18",border:"none",borderRadius:4,padding:"7px 18px",color:"#1a7010",fontSize:12,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>Save Field</button>
    </div>
  </div>);
}

// ── Fields Table ──────────────────────────────────────────────────────────────
function FieldsTable({fields,onSelect,onExportCSV,onPrint,seedLogs={}}){
  const[sortKey,setSortKey]=useState("farm");const[sortDir,setSortDir]=useState(1);
  const sorted=useMemo(()=>[...fields].sort((a,b)=>{
    let av,bv;
    if(sortKey==="revenue"){av=calc(a).revenue;bv=calc(b).revenue;}
    else if(sortKey==="net"){av=calc(a).net;bv=calc(b).net;}
    else if(sortKey==="acres"){av=a.acres;bv=b.acres;}
    else{av=(a.farm||"")+(a.common||"");bv=(b.farm||"")+(b.common||"");return sortDir*av.localeCompare(bv,undefined,{numeric:true,sensitivity:"base"});}
    return sortDir*(av>bv?1:av<bv?-1:0);
  }),[fields,sortKey,sortDir]);
  const ts=k=>{if(sortKey===k)setSortDir(d=>-d);else{setSortKey(k);setSortDir(1);}};
  const Th=({label,k,right})=>(<th onClick={()=>ts(k)} style={{padding:"8px 10px",fontSize:10,color:sortKey===k?"#1a7010":"#6a8a50",textTransform:"uppercase",letterSpacing:0.8,cursor:"pointer",textAlign:right?"right":"left",background:"#ffffff",borderBottom:"2px solid #2a4030",fontWeight:500,whiteSpace:"nowrap"}}>{label}{sortKey===k?(sortDir>0?" ↑":" ↓"):""}</th>);
  const totRev=fields.reduce((s,f)=>s+calc(f).revenue,0);const totExp=fields.reduce((s,f)=>s+calc(f).expenses,0);const totNet=totRev-totExp;const totAc=fields.reduce((s,f)=>s+f.acres,0);
  return(<div>
    <div style={{display:"flex",alignItems:"center",marginBottom:16,gap:10}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#1a4010"}}>All Fields</div>
      <div style={{fontSize:12,color:"#7a9260"}}>— {fields.length} units · {totAc.toFixed(0)} ac</div>
      <div style={{marginLeft:"auto",display:"flex",gap:8}}>
        <button onClick={onExportCSV} style={{background:"#1a3a20",border:"1px solid #2a5030",borderRadius:4,padding:"6px 14px",color:"#2a7010",fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>↓ Export CSV</button>
        <button onClick={onPrint} style={{background:"#d4e4f4",border:"1px solid #2a3a5a",borderRadius:4,padding:"6px 14px",color:"#70a0c0",fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>🖨 Print / PDF</button>
      </div>
    </div>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
      <thead><tr>
        <Th label="Ent" k="entity"/><Th label="Farm" k="farm"/><Th label="Field" k="common"/>
        <th style={{padding:"8px 10px",fontSize:10,color:"#6a8a50",textTransform:"uppercase",letterSpacing:0.8,background:"#ffffff",borderBottom:"2px solid #2a4030"}}>Crop</th>
        <Th label="Acres" k="acres" right/><Th label="Revenue" k="revenue" right/><Th label="Expenses" k="expenses" right/><Th label="Net" k="net" right/>
      </tr></thead>
      <tbody>
        {sorted.map((f,i)=>{const c=calc(f);const inelig=(_globallyIneligible||GLOBALLY_INELIGIBLE).has(f.crop)||!(f.eligibleCrops||[]).includes(f.crop);const hasOv=Object.keys(f.expenseOverrides||{}).length>0;
          return(<tr key={f.id} onClick={()=>onSelect(f)} style={{background:i%2===0?"#f6f9f0":"#ffffff",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#e4f0d4"} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#f6f9f0":"#ffffff"}>
            <td style={{padding:"7px 10px",borderBottom:"1px solid #141e14"}}><span style={{background:"#d4ecc0",padding:"1px 5px",borderRadius:2,fontSize:9,color:"#2a7010"}}>{(f.entity||"").slice(0,3).toUpperCase()||"—"}</span></td>
            <td style={{padding:"7px 10px",color:"#3a6028",borderBottom:"1px solid #141e14"}}>{f.farm}</td>
            <td style={{padding:"7px 10px",color:"#1a4010",borderBottom:"1px solid #141e14",minWidth:160}}>{f.common}{f.fieldNum&&<span style={{fontSize:10,color:"#6a8a50"}}> #{f.fieldNum}</span>}{hasOv&&<span title="Has field overrides" style={{marginLeft:5,fontSize:9,color:"#8a6010"}}>★</span>}</td>
            <td style={{padding:"7px 10px",borderBottom:"1px solid #141e14"}}>
              <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"1px 7px",background:inelig?"#fff0f0":"#dce8c6",borderRadius:3,fontSize:11,color:inelig?"#c02020":"#2a7010"}}><span style={{width:5,height:5,borderRadius:"50%",background:inelig?"#c02020":"#3a9020"}}/>{f.crop}</span>
              {(seedLogs[f.common]||[]).length>0&&<span style={{marginLeft:4,fontSize:9,background:"#c8f0a8",color:"#1a5010",padding:"1px 5px",borderRadius:2,fontWeight:700,verticalAlign:"middle"}}>🌱</span>}
            </td>
            <td style={{padding:"7px 10px",color:"#3a6028",textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,borderBottom:"1px solid #141e14"}}>{f.acres.toFixed(1)}</td>
            <td style={{padding:"7px 10px",color:"#1a7010",textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,borderBottom:"1px solid #141e14"}}>{f$(c.revenue)}</td>
            <td style={{padding:"7px 10px",color:"#c05010",textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,borderBottom:"1px solid #141e14"}}>{f$(c.expenses)}</td>
            <td style={{padding:"7px 10px",color:c.net>=0?"#1a7010":"#c02020",textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,borderBottom:"1px solid #141e14"}}>{f$(c.net,true)}</td>
          </tr>);
        })}
      </tbody>
      <tfoot><tr style={{background:"#e4f0d0"}}>
        <td colSpan={4} style={{padding:"9px 10px",fontSize:12,color:"#7aaa60",fontWeight:600}}>TOTALS — {fields.length} field units</td>
        <td style={{padding:"9px 10px",color:"#9aaa7a",textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,fontWeight:600}}>{totAc.toFixed(0)} ac</td>
        <td style={{padding:"9px 10px",color:"#1a7010",textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,fontWeight:600}}>{f$(totRev)}</td>
        <td style={{padding:"9px 10px",color:"#c05010",textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,fontWeight:600}}>{f$(totExp)}</td>
        <td style={{padding:"9px 10px",textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,fontWeight:600,color:totNet>=0?"#1a7010":"#c02020"}}>{f$(totNet,true)}</td>
      </tr></tfoot>
    </table>
  </div>);
}


// ── localStorage helpers ──────────────────────────────────────────────────────
const DATA_VERSION = "2026-v6";

// ── Sync helpers — write to Firebase, mirror to localStorage as offline cache ──
// Set to true when running inside Agri Logix (tenantId present) — skips localStorage
let _isAgriLogixTenant = false;
let _expRates         = null; // set per render from state; falls back to DEFAULT_RATES
let _cropRates        = null; // set per render from state; falls back to CROP_EXP_DEFAULTS
let _tenantCrops        = null; // per-tenant crop list; null = use ALL_CROPS
let _globallyIneligible = null; // per-tenant ineligible set; null = use GLOBALLY_INELIGIBLE
let _aphData            = null; // imported APH data from crop insurance PDF
let _fieldHistory       = null; // manually entered crop history per field
let _cropPrices         = null; // per-tenant price elections + projected sell prices
let _tenantIdCache      = null; // set from AgriPlanModule — tenantId for cache keys below

// ── Tenant-mode offline cache (mirrors AgriScale's queue/retry pattern) ──────
function tenantCacheKey(tid, year){ return `agriplan_tenant_${tid}_${year}`; }
function tenantQueueKey(tid, year){ return `agriplan_tenant_queue_${tid}_${year}`; }
function loadTenantFieldsCache(tid, year){
  try{ const r=localStorage.getItem(tenantCacheKey(tid,year)); return r?JSON.parse(r):null; }
  catch{ return null; }
}
function saveTenantFieldsCache(tid, year, fields){
  try{ localStorage.setItem(tenantCacheKey(tid,year), JSON.stringify(fields)); }catch{}
}
function loadTenantQueue(tid, year){
  try{ const r=localStorage.getItem(tenantQueueKey(tid,year)); return r?JSON.parse(r):null; }
  catch{ return null; }
}
function saveTenantQueue(tid, year, fields){
  try{ localStorage.setItem(tenantQueueKey(tid,year), JSON.stringify({fields,savedAt:Date.now()})); }catch{}
}
function clearTenantQueue(tid, year){
  try{ localStorage.removeItem(tenantQueueKey(tid,year)); }catch{}
}
function lsKey(year){ return `agriplan_fields_${year}`; }

function loadYears(){
  try{ const y=localStorage.getItem("agriplan_years"); return y?JSON.parse(y):["2026"]; }
  catch{ return ["2026"]; }
}
function saveYears(years){
  try{ localStorage.setItem("agriplan_years",JSON.stringify(years)); }catch{}
  fbSaveYears(years).catch(()=>{});
}
function loadFields(year){
  if(_isAgriLogixTenant) return _tenantIdCache ? (loadTenantFieldsCache(_tenantIdCache, year) || []) : [];
  // Try localStorage cache first (fast/offline)
  try{
    const raw=localStorage.getItem(lsKey(year));
    if(raw){
      const parsed=JSON.parse(raw);
      const savedVersion=localStorage.getItem('agriplan_data_version');
      if(parsed&&parsed.length>0&&savedVersion===DATA_VERSION) return parsed;
    }
  }catch{}
  // Fall back to INITIAL_FIELDS for 2026
  if(year==="2026"){
    const fresh=INITIAL_FIELDS.map(f=>({...f,expenseOverrides:{...f.expenseOverrides}}));
    try{
      localStorage.setItem(lsKey(year),JSON.stringify(fresh));
      localStorage.setItem('agriplan_data_version',DATA_VERSION);
    }catch{}
    return fresh;
  }
  return [];
}
function saveFields(year, fields, onStatus){
  if(!_isAgriLogixTenant){
    try{ localStorage.setItem(lsKey(year),JSON.stringify(fields)); }catch{}
  } else if(_tenantIdCache){
    // Local-first, same as AgriScale: cache + queue BEFORE attempting the network write,
    // so a dropped connection never loses data — only delays the sync.
    saveTenantFieldsCache(_tenantIdCache, year, fields);
    saveTenantQueue(_tenantIdCache, year, fields);
  }
  if(onStatus) onStatus('saving');
  fbSaveFields(year, fields)
    .then(()=>{
      if(_isAgriLogixTenant && _tenantIdCache) clearTenantQueue(_tenantIdCache, year);
      if(onStatus) onStatus('saved');
    })
    .catch((e)=>{
      console.error("🔴 AgriPlan Firebase save FAILED:",e.message);
      // Distinguish "genuinely offline, safely queued" from "server rejected it" —
      // the former shouldn't read as alarming since nothing was lost.
      if(onStatus) onStatus(navigator.onLine ? 'error' : 'queued');
    });
}
function loadHistRevCache(){
  try{ const r=localStorage.getItem('agriplan_hist_revenue'); return r?JSON.parse(r):{} }
  catch{ return {}; }
}
function saveHistRevCache(data){
  try{ localStorage.setItem('agriplan_hist_revenue',JSON.stringify(data)); }catch{}
}




// ── Manage Crops Modal ────────────────────────────────────────────────────────
function ManageCropsModal({ tenantId, token, tenantCrops, onSave, onClose }) {
  const [crops, setCrops] = useState(tenantCrops.length > 0 ? [...tenantCrops] : [...ALL_CROPS]);
  const [newCrop, setNewCrop] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const add = () => {
    const name = newCrop.trim();
    if (!name) return;
    if (crops.find(c => c.toLowerCase() === name.toLowerCase())) { setErr("Crop already exists"); return; }
    setCrops(p => [...p, name]);
    setNewCrop(""); setErr("");
  };

  const remove = (c) => setCrops(p => p.filter(x => x !== c));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `https://agrilogix-1bd06-default-rtdb.firebaseio.com/tenants/${tenantId}/agriPlan/crops.json?auth=${token}`,
        { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(crops) }
      );
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      onSave(crops);
      onClose();
    } catch(e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:4000}}>
      <div style={{background:"#fff",borderRadius:12,padding:28,width:520,maxHeight:"82vh",overflowY:"auto",
        boxShadow:"0 20px 60px rgba(0,0,0,0.3)",border:"1px solid #ccdda0",fontFamily:"'Barlow',sans-serif"}}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#1a3010"}}>🌾 Manage Crops</div>
            <div style={{fontSize:12,color:"#7a9260",marginTop:3}}>Add or remove crops available for planning on this account. All new fields will have all crops eligible by default.</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"1px solid #ccdda0",borderRadius:6,padding:"4px 12px",cursor:"pointer",color:"#7a9260",fontSize:13}}>✕</button>
        </div>

        {err && <div style={{background:"#fff0f0",border:"1px solid #e08080",borderRadius:5,padding:"6px 10px",fontSize:12,color:"#c02020",marginBottom:12}}>{err}</div>}

        {/* Add new crop */}
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <input value={newCrop} onChange={e=>{setNewCrop(e.target.value);setErr("");}}
            onKeyDown={e=>e.key==="Enter"&&add()}
            placeholder="Enter crop name…"
            style={{flex:1,border:"1px solid #2a4030",borderRadius:5,padding:"7px 10px",fontSize:13,
              color:"#1a3010",fontFamily:"inherit",outline:"none",background:"#f8fbf5"}}/>
          <button onClick={add} style={{background:"#2a7a18",color:"#fff",border:"none",borderRadius:5,
            padding:"7px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
            + Add Crop
          </button>
        </div>

        {/* Crop list */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
          {crops.map(c => (
            <div key={c} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              background:"#f0f8e8",border:"1px solid #b8d8a0",borderRadius:5,padding:"6px 10px"}}>
              <span style={{fontSize:13,color:"#1a4010",fontWeight:600}}>{c}</span>
              <button onClick={()=>remove(c)} style={{background:"none",border:"none",color:"#c04040",
                cursor:"pointer",fontSize:16,lineHeight:1,padding:"0 4px",fontFamily:"inherit"}}>×</button>
            </div>
          ))}
          {crops.length === 0 && <div style={{gridColumn:"1/-1",textAlign:"center",color:"#9aaa80",fontSize:13,padding:20}}>No crops added yet.</div>}
        </div>

        <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid #e0eccc",paddingTop:16}}>
          <button onClick={onClose} style={{background:"#f8fbf5",border:"1px solid #ccdda0",borderRadius:6,padding:"7px 18px",fontSize:13,cursor:"pointer",color:"#7a9260",fontFamily:"inherit"}}>Cancel</button>
          <button onClick={save} disabled={saving} style={{background:saving?"#8ab870":"#2a7a18",border:"none",borderRadius:6,padding:"7px 22px",fontSize:13,color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            {saving?"Saving…":"Save Crops"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ── Seed Log Section (shown in FieldDetail) ───────────────────────────────────
function SeedLogSection({ fieldName, plannedCrop, logs, tenantId }) {
  const [expanded, setExpanded] = useState(null); // index of expanded log

  if (!logs.length) {
    return tenantId ? (
      <div style={{background:"#f8f4ee",border:"1px dashed #c8b870",borderRadius:6,
        padding:"8px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8,
        fontSize:12,color:"#8a7040"}}>
        <span>🌱</span>
        <span>No seeding logged in AgriField yet for {new Date().getFullYear()}.</span>
      </div>
    ) : null;
  }

  const row = (label, value) => value ? (
    <div style={{display:"flex",gap:8,padding:"3px 0",borderBottom:"1px solid #e8f0d8"}}>
      <span style={{fontSize:11,color:"#7a9260",minWidth:130,flexShrink:0}}>{label}</span>
      <span style={{fontSize:11,color:"#1a3010",fontWeight:500}}>{value}</span>
    </div>
  ) : null;

  return (
    <div style={{marginBottom:14}}>
      {logs.map((log, i) => {
        const cropNames = log.crops.map(c=>c.crop).filter(Boolean).join(", ");
        const matches = !plannedCrop || cropNames.toLowerCase().includes((plannedCrop||"").toLowerCase());
        const isOpen = expanded === i;
        const bg = matches ? "#eaf8e0" : "#fff8e0";
        const border = matches ? "#5cb850" : "#c8a030";

        return (
          <div key={i} style={{border:`1px solid ${border}`,borderRadius:7,marginBottom:8,overflow:"hidden"}}>
            {/* Summary row — always visible */}
            <div style={{background:bg,padding:"8px 14px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:15}}>🌱</span>
              <strong style={{fontSize:12,color:matches?"#1a6010":"#7a5000"}}>
                Seeded {new Date(log.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
              </strong>
              {log.crops.map((c,j) => (
                <span key={j} style={{background:matches?"#c8f0b0":"#f0dea0",padding:"1px 8px",
                  borderRadius:3,fontSize:11,fontWeight:700,color:matches?"#1a5010":"#6a4000"}}>
                  {c.crop}{c.variety?` — ${c.variety}`:""}{c.seedRate?` @ ${c.seedRate} lbs/ac`:""}
                </span>
              ))}
              {!matches && plannedCrop && (
                <span style={{fontSize:11,color:"#8a6000",fontStyle:"italic"}}>⚠ Plan shows {plannedCrop}</span>
              )}
              {/* Expand/collapse link */}
              <button onClick={()=>setExpanded(isOpen?null:i)} style={{
                marginLeft:"auto",background:"none",border:"none",cursor:"pointer",
                fontSize:11,color:matches?"#2a7a18":"#8a5000",fontFamily:"'Barlow',sans-serif",
                fontWeight:600,textDecoration:"underline",padding:0,flexShrink:0
              }}>
                {isOpen ? "▲ Hide details" : "▼ Full log"}
              </button>
            </div>

            {/* Full detail — expanded */}
            {isOpen && (
              <div style={{padding:"12px 16px",background:"#fff",fontSize:12}}>
                {/* Seed */}
                {log.crops.length > 0 && (
                  <div style={{marginBottom:10}}>
                    <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,
                      color:"#5a8a40",marginBottom:4}}>🌾 Seed</div>
                    {log.crops.map((c,j) => (
                      <div key={j} style={{marginBottom:4}}>
                        {row("Crop", c.crop)}
                        {row("Variety", c.variety)}
                        {row("Seed Rate", c.seedRate ? `${c.seedRate} lbs/ac` : null)}
                        {row("Total Seed", c.totalSeed ? `${c.totalSeed} lbs` : null)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Fertilizer */}
                {log.ferts?.length > 0 && (
                  <div style={{marginBottom:10}}>
                    <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,
                      color:"#5a8a40",marginBottom:4}}>🧪 Fertilizer</div>
                    {log.ferts.map((f,j) => (
                      <div key={j} style={{marginBottom:4}}>
                        {row("Blend", f.blend||f.custom)}
                        {row("Rate", f.rate ? `${f.rate} lbs/ac` : null)}
                        {row("Total", f.total ? `${f.total} lbs` : null)}
                        {row("Placement", f.placement)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Inoculants */}
                {log.inoculants?.length > 0 && (
                  <div style={{marginBottom:10}}>
                    <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,
                      color:"#5a8a40",marginBottom:4}}>💉 Inoculant</div>
                    {log.inoculants.map((n,j) => (
                      <div key={j} style={{marginBottom:4}}>
                        {row("Product", n.product)}
                        {row("Rate", n.rate)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Equipment & conditions */}
                <div>
                  <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,
                    color:"#5a8a40",marginBottom:4}}>⚙️ Equipment & Conditions</div>
                  {row("Equipment", log.equipment)}
                  {row("Seeding Depth", log.depth ? `${log.depth}"` : null)}
                  {row("Notes", log.notes)}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Expense Defaults Editor ──────────────────────────────────────────────────
const CROPS_LIST = ["Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Durum",
  "Lentils","Chickpeas","Austrians","Green Peas","Yellow Peas","Mustard","Canola","Flax"];

function ExpenseDefaultsModal({ tenantId, token, expenseDefaults, cropExpDefaults, onSave, onClose }) {
  const [baseRates, setBaseRates] = useState({...expenseDefaults});
  const [cropRates, setCropRates] = useState(
    CROPS_LIST.reduce((acc,c)=>({...acc,[c]:{seed:0,fertilizerChemical:0,cropInsurance:0,...(cropExpDefaults[c]||{})}}),{})
  );
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("base");

  const upBase = (k,v) => setBaseRates(p=>({...p,[k]:+v||0}));
  const upCrop = (crop,k,v) => setCropRates(p=>({...p,[crop]:{...p[crop],[k]:+v||0}}));

  const copyFAVT = () => {
    setBaseRates({...DEFAULT_RATES});
    setCropRates(CROPS_LIST.reduce((acc,c)=>({...acc,[c]:{seed:0,fertilizerChemical:0,cropInsurance:0,...(CROP_EXP_DEFAULTS[c]||{})}}),{}));
  };

  const handleSave = async () => {
    setSaving(true);
    const DB = "https://agrilogix-1bd06-default-rtdb.firebaseio.com";
    try {
      await Promise.all([
        fetch(`${DB}/tenants/${tenantId}/agriPlan/expenseDefaults.json?auth=${token}`,
          {method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(baseRates)}),
        fetch(`${DB}/tenants/${tenantId}/agriPlan/cropExpDefaults.json?auth=${token}`,
          {method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(cropRates)}),
      ]);
      onSave(baseRates, cropRates);
      onClose();
    } catch(e) { alert("Save failed: " + e.message); }
    finally { setSaving(false); }
  };

  const inp = (val, onChange) => (
    <input type="number" step="0.01" value={val||""} onChange={e=>onChange(e.target.value)}
      style={{width:"100%",background:"#fff",border:"1px solid #2a4030",borderRadius:4,
        padding:"4px 7px",fontSize:12,color:"#1a3010",fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}/>
  );

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:4000}}>
      <div style={{background:"#fff",borderRadius:12,padding:28,width:820,maxHeight:"88vh",overflowY:"auto",
        boxShadow:"0 20px 60px rgba(0,0,0,0.3)",border:"1px solid #ccdda0",fontFamily:"'Barlow',sans-serif"}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#1a3010"}}>⚙️ Default Expense Rates</div>
            <div style={{fontSize:12,color:"#7a9260",marginTop:3}}>Per-acre rates used as defaults for all fields on this account. Override per-field in the field detail.</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={copyFAVT} style={{background:"#f0f4e8",border:"1px solid #8ab870",borderRadius:5,padding:"5px 12px",fontSize:11,cursor:"pointer",color:"#3a6020",fontFamily:"inherit"}}>
              Copy AgriLogix Defaults
            </button>
            <button onClick={onClose} style={{background:"none",border:"1px solid #ccdda0",borderRadius:6,padding:"4px 12px",cursor:"pointer",color:"#7a9260",fontSize:13}}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:0,borderBottom:"1px solid #ccdda0",marginBottom:18}}>
          {[["base","📊 Base Rates ($/ac)"],["crops","🌾 Crop Overrides"]].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)} style={{padding:"7px 18px",background:"none",border:"none",
              borderBottom:`2px solid ${tab===id?"#5cb850":"transparent"}`,color:tab===id?"#1a7010":"#7a9260",
              fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:tab===id?700:400}}>
              {lbl}
            </button>
          ))}
        </div>

        {tab==="base" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 20px"}}>
            {EXP.map(([k,lbl])=>(
              <label key={k} style={{display:"grid",gridTemplateColumns:"1fr 100px",gap:8,alignItems:"center"}}>
                <span style={{fontSize:12,color:"#3a6020"}}>{lbl}</span>
                {inp(baseRates[k]??0, v=>upBase(k,v))}
              </label>
            ))}
          </div>
        )}

        {tab==="crops" && (
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:"#1e3a18",color:"#c8e8a0"}}>
                  <th style={{padding:"8px 12px",textAlign:"left",fontSize:11}}>Crop</th>
                  <th style={{padding:"8px 12px",textAlign:"right",fontSize:11}}>Seed ($/ac)</th>
                  <th style={{padding:"8px 12px",textAlign:"right",fontSize:11}}>Fert/Chem ($/ac)</th>
                  <th style={{padding:"8px 12px",textAlign:"right",fontSize:11}}>Crop Ins. ($/ac)</th>
                </tr>
              </thead>
              <tbody>
                {CROPS_LIST.map((crop,i)=>(
                  <tr key={crop} style={{background:i%2===0?"#f6f9f0":"#fff",borderBottom:"1px solid #e0eccc"}}>
                    <td style={{padding:"5px 12px",fontWeight:600,color:"#1a4010"}}>{crop}</td>
                    {["seed","fertilizerChemical","cropInsurance"].map(k=>(
                      <td key={k} style={{padding:"4px 8px",textAlign:"right"}}>
                        {inp(cropRates[crop]?.[k]??0, v=>upCrop(crop,k,v))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{fontSize:11,color:"#9aaa80",marginTop:10}}>
              Crop overrides replace the base rate for that line item when that crop is planned. Leave at 0 to use the base rate.
            </div>
          </div>
        )}

        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20,paddingTop:16,borderTop:"1px solid #e0eccc"}}>
          <button onClick={onClose} style={{background:"#f8fbf5",border:"1px solid #ccdda0",borderRadius:6,padding:"7px 18px",fontSize:13,cursor:"pointer",color:"#7a9260",fontFamily:"inherit"}}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{background:saving?"#8ab870":"#2a7a18",border:"none",borderRadius:6,padding:"7px 22px",fontSize:13,color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            {saving?"Saving…":"Save Rates"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ── Crop Prices Editor ────────────────────────────────────────────────────────
function CropPricesModal({ tenantId, token, tenantCrops, cropPrices, onSave, onClose }) {
  const crops = tenantCrops.length > 0 ? tenantCrops : ALL_CROPS.filter(c => CROP_TYPICAL[c]);
  const [prices, setPrices] = useState(() => {
    const init = {};
    crops.forEach(c => {
      const t = CROP_TYPICAL[c] || {};
      const saved = cropPrices[c] || {};
      init[c] = {
        priceGuar: saved.priceGuar ?? t.priceGuar ?? 0,
        projPrice: saved.projPrice ?? t.projPrice ?? 0,
      };
    });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const upd = (crop, key, val) => { const n=parseFloat(val); setPrices(p => ({...p, [crop]: {...p[crop], [key]: isFinite(n)?n:0}})); };

  const copyDefaults = () => {
    const init = {};
    crops.forEach(c => {
      const t = CROP_TYPICAL[c] || {};
      init[c] = { priceGuar: t.priceGuar || 0, projPrice: t.projPrice || 0 };
    });
    setPrices(init);
  };

  const save = async () => {
    setSaving(true); setErr("");
    try {
      // Sanitize values and store as array (crop names as values, not keys — avoids Firebase key restrictions)
      const asArray = Object.entries(prices).map(([crop, vals]) => {
        const pg = parseFloat(vals.priceGuar);
        const pp = parseFloat(vals.projPrice);
        return { crop, priceGuar: isFinite(pg)?pg:0, projPrice: isFinite(pp)?pp:0 };
      });
      const res = await fetch(
        `https://agrilogix-1bd06-default-rtdb.firebaseio.com/tenants/${tenantId}/agriPlan/cropPrices.json?auth=${token}`,
        { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(asArray) }
      );
      if (!res.ok) {
        const errBody = await res.text().catch(()=>"");
        throw new Error(`Save failed: ${res.status} — ${errBody.slice(0,120)}`);
      }
      // Convert back to {crop: {priceGuar, projPrice}} for local state
      const clean = {};
      asArray.forEach(({crop,priceGuar,projPrice}) => { clean[crop]={priceGuar,projPrice}; });
      onSave(clean);
      onClose();
    } catch(e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const inp = (val, onChange) => (
    <input type="number" step="0.01" value={val||""} onChange={e=>onChange(e.target.value)}
      style={{width:"100%",border:"1px solid #2a4030",borderRadius:4,padding:"4px 7px",
        fontSize:12,color:"#1a3010",fontFamily:"'IBM Plex Mono',monospace",outline:"none",
        background:"#fff",textAlign:"right"}}/>
  );

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:4000}}>
      <div style={{background:"#fff",borderRadius:12,padding:28,width:680,maxHeight:"88vh",overflowY:"auto",
        boxShadow:"0 20px 60px rgba(0,0,0,0.3)",border:"1px solid #ccdda0",fontFamily:"'Barlow',sans-serif"}}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#1a3010"}}>💲 Crop Prices</div>
            <div style={{fontSize:12,color:"#7a9260",marginTop:3}}>
              Set your crop insurance price elections and projected sell prices for budget calculations.
              These override the built-in defaults for your account.
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={copyDefaults} style={{background:"#f0f4e8",border:"1px solid #8ab870",borderRadius:5,
              padding:"5px 12px",fontSize:11,cursor:"pointer",color:"#3a6020",fontFamily:"inherit",whiteSpace:"nowrap"}}>
              Copy AgriLogix Defaults
            </button>
            <button onClick={onClose} style={{background:"none",border:"1px solid #ccdda0",borderRadius:6,
              padding:"4px 12px",cursor:"pointer",color:"#7a9260",fontSize:13}}>✕</button>
          </div>
        </div>

        {err && <div style={{background:"#fff0f0",border:"1px solid #e08080",borderRadius:5,
          padding:"6px 10px",fontSize:12,color:"#c02020",marginBottom:12}}>{err}</div>}

        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:16}}>
          <thead>
            <tr style={{background:"#1e3a18",color:"#c8e8a0"}}>
              <th style={{padding:"7px 10px",textAlign:"left",fontSize:10,letterSpacing:0.5}}>Crop</th>
              <th style={{padding:"7px 10px",textAlign:"center",fontSize:10,letterSpacing:0.5,width:160}}>
                Insurance Price Election<br/>
                <span style={{fontSize:9,opacity:0.7,fontWeight:400}}>($/bu — RMA sets each spring)</span>
              </th>
              <th style={{padding:"7px 10px",textAlign:"center",fontSize:10,letterSpacing:0.5,width:160}}>
                Projected Sell Price<br/>
                <span style={{fontSize:9,opacity:0.7,fontWeight:400}}>($/bu — your market estimate)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {crops.filter(c => CROP_TYPICAL[c]).map((crop,i) => (
              <tr key={crop} style={{background:i%2===0?"#f6f9f0":"#fff",borderBottom:"1px solid #e0eccc"}}>
                <td style={{padding:"5px 10px",fontWeight:600,color:"#1a4010"}}>{crop}</td>
                <td style={{padding:"4px 8px"}}>
                  {inp(prices[crop]?.priceGuar, v=>upd(crop,"priceGuar",v))}
                </td>
                <td style={{padding:"4px 8px"}}>
                  {inp(prices[crop]?.projPrice, v=>upd(crop,"projPrice",v))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{fontSize:11,color:"#9aaa80",marginBottom:16}}>
          💡 Insurance Price Election is published by RMA each spring — check with your agent for current values.
          Projected Sell Price is your own estimate for planning purposes.
        </div>

        <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid #e0eccc",paddingTop:16}}>
          <button onClick={onClose} style={{background:"#f8fbf5",border:"1px solid #ccdda0",borderRadius:6,
            padding:"7px 18px",fontSize:13,cursor:"pointer",color:"#7a9260",fontFamily:"inherit"}}>Cancel</button>
          <button onClick={save} disabled={saving} style={{background:saving?"#8ab870":"#2a7a18",border:"none",
            borderRadius:6,padding:"7px 22px",fontSize:13,color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            {saving?"Saving…":"Save Prices"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── APH Import Modal ──────────────────────────────────────────────────────────
function ImportAPHModal({ tenantId, token, fields, onClose, onImported }) {
  const [stage, setStage] = useState("upload"); // upload | converting | parsing | review | saving | done
  const [error, setError] = useState("");
  const [parsed, setParsed] = useState(null);   // merged Claude output across all batches
  const [matches, setMatches] = useState({});   // unitIndex → fieldId
  const [pageProgress, setPageProgress] = useState({ done: 0, total: 0 });
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });

  const MAX_PAGES = 60;           // generous hard cap — batching means page count itself isn't the constraint
  const MAX_BATCH_BYTES = 1.6e6;  // small enough that each batch also finishes well inside the function timeout, not just the payload size limit

  // Load PDF.js from CDN once, reused across uploads
  const loadPdfJs = () => new Promise((resolve, reject) => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
    const existing = document.getElementById("pdfjs-lib");
    if (existing) { existing.addEventListener("load", () => resolve(window.pdfjsLib)); return; }
    const s = document.createElement("script");
    s.id = "pdfjs-lib";
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    s.onerror = () => reject(new Error("Could not load PDF reader — check your connection and try again"));
    document.head.appendChild(s);
  });

  // Render every PDF page (up to MAX_PAGES) to a compressed JPEG (base64, no data: prefix).
  const pdfToImages = async (file) => {
    const pdfjsLib = await loadPdfJs();
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const pageCap = Math.min(pdf.numPages, MAX_PAGES);
    setPageProgress({ done: 0, total: pageCap });
    const images = [];
    for (let i = 1; i <= pageCap; i++) {
      const page = await pdf.getPage(i);
      // Start at a sharp scale, but back off if a page comes out unexpectedly large
      let base64 = null;
      for (const scale of [2.0, 1.5, 1.0]) {
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        base64 = await new Promise((res) => {
          canvas.toBlob((blob) => {
            const r = new FileReader();
            r.onload = () => res(r.result.split(",")[1]);
            r.readAsDataURL(blob);
          }, "image/jpeg", 0.75);
        });
        if (base64.length < 700000 || scale === 1.0) break; // ~700KB base64 per page budget
      }
      images.push(base64);
      setPageProgress({ done: i, total: pageCap });
    }
    return { images, truncated: pdf.numPages > MAX_PAGES, totalPages: pdf.numPages };
  };

  // Group page images into batches that each stay under the per-request byte budget.
  const chunkIntoBatches = (images) => {
    const batches = [];
    let current = [], currentBytes = 0;
    for (const img of images) {
      if (current.length && currentBytes + img.length > MAX_BATCH_BYTES) {
        batches.push(current);
        current = []; currentBytes = 0;
      }
      current.push(img); currentBytes += img.length;
    }
    if (current.length) batches.push(current);
    return batches;
  };

  // Merge units across batches — a field's history can span a page boundary between
  // two batches, so combine by field+crop instead of just concatenating.
  const mergeUnits = (acc, newUnits) => {
    const keyOf = (u) => `${(u.fieldName||"").toLowerCase().trim()}|${(u.crop||"").toLowerCase().trim()}`;
    (newUnits||[]).forEach(nu => {
      const existing = acc.find(u => keyOf(u) === keyOf(nu));
      if (existing) {
        const byYear = {};
        [...(existing.years||[]), ...(nu.years||[])].forEach(y => { byYear[y.year] = y; });
        existing.years = Object.values(byYear).sort((a,b)=>a.year-b.year);
        existing.aphYield = existing.aphYield ?? nu.aphYield;
        existing.aphYears = existing.aphYears ?? nu.aphYears;
        existing.priceElection = existing.priceElection ?? nu.priceElection;
      } else {
        acc.push({ ...nu });
      }
    });
    return acc;
  };

  const DB = "https://agrilogix-1bd06-default-rtdb.firebaseio.com";

  // aph-parse now runs as a Netlify Background Function (15-min budget instead of ~26s),
  // which means it can't return a response directly — each batch call just gets accepted
  // (202) and the real work happens async, writing its result to Firebase. We poll there
  // until every batch for this job has reported done/error.
  const pollJob = async (jobId, totalBatches) => {
    const POLL_MS = 3000;
    const MAX_WAIT_MS = 12 * 60 * 1000; // background functions get ~15 min; leave headroom
    const start = Date.now();
    while (true) {
      if (Date.now() - start > MAX_WAIT_MS) {
        throw new Error("Import timed out — the document may be too large or complex. Try a smaller PDF.");
      }
      const res = await fetch(`${DB}/tenants/${tenantId}/aphJobs/${jobId}/batches.json?auth=${token}`);
      const batches = (await res.json()) || {};
      const doneCount = Object.keys(batches).filter(k => batches[k]?.status === "done" || batches[k]?.status === "error").length;
      setBatchProgress({ done: doneCount, total: totalBatches });
      if (doneCount >= totalBatches) return batches;
      await new Promise(r => setTimeout(r, POLL_MS));
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(""); setStage("converting");
    try {
      const { images, truncated, totalPages } = await pdfToImages(file);
      if (images.length === 0) throw new Error("Could not process any pages from this PDF");
      if (truncated) setError(`Note: PDF has ${totalPages} pages — only the first ${MAX_PAGES} were processed.`);

      const batches = chunkIntoBatches(images);
      setBatchProgress({ done: 0, total: batches.length });
      setStage("parsing");

      const jobId = `aph_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

      // Enqueue every batch as its own background-function invocation. Each fetch resolves
      // as soon as Netlify accepts the job — the Claude call + Firebase write happen after
      // that, server-side, so we don't await the response body here.
      for (let b = 0; b < batches.length; b++) {
        fetch("/.netlify/functions/aph-parse-background", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ images: batches[b], tenantId, jobId, batchIndex: b })
        }).catch(err => console.error(`[APH import] failed to enqueue batch ${b+1}:`, err.message));
        // Small stagger so we don't fire a burst of concurrent Claude calls at once.
        if (b < batches.length - 1) await new Promise(r => setTimeout(r, 400));
      }

      const results = await pollJob(jobId, batches.length);

      let mergedUnits = [];
      let insured = "", county = "";
      for (let b = 0; b < batches.length; b++) {
        const result = results[b];
        if (!result || result.status === "error") {
          const errMsg = result?.error || "No result returned — the batch may not have completed";
          console.error(`[APH import] batch ${b+1}/${batches.length} failed:`, errMsg);
          if (result?.raw) console.error(`[APH import] raw Claude response for batch ${b+1}:`, result.raw);
          throw new Error(result?.raw ? `${errMsg} — Claude returned: "${result.raw.slice(0,300)}"` : errMsg);
        }
        const data = result.data || {};
        mergedUnits = mergeUnits(mergedUnits, data.units);
        insured = insured || data.insured || "";
        county = county || data.county || "";
      }

      // Clean up the job node now that we've read the results — no need to keep it around.
      fetch(`${DB}/tenants/${tenantId}/aphJobs/${jobId}.json?auth=${token}`, { method: "DELETE" }).catch(()=>{});

      if (!mergedUnits.length) throw new Error("No APH units found in PDF — check the file and try again");
      const data = { insured, county, units: mergedUnits };
      setParsed(data);
      // Auto-match units to AgriPlan fields by common name similarity
      const auto = {};
      (data.units || []).forEach((unit, i) => {
        const name = (unit.fieldName || "").toLowerCase().trim();
        // Exact match first, then partial
        let match = fields.find(f => f.common?.toLowerCase() === name);
        if (!match) match = fields.find(f =>
          name.includes(f.common?.toLowerCase()) || f.common?.toLowerCase().includes(name.split("|")[0].trim())
        );
        auto[i] = match?.id || "";
      });
      setMatches(auto);
      setStage("review");
    } catch (err) { setError(err.message); setStage("upload"); }
  };

  const matchedCount = Object.values(matches).filter(Boolean).length;

  const handleSave = async () => {
    setStage("saving");
    try {
      // Build aphData: { [fieldCommon]: { [year]: { [crop]: {acres, yield, production} }, aphYield, aphYears } }
      const aphData = {};
      (parsed.units || []).forEach((unit, i) => {
        const fieldId = matches[i]; if (!fieldId) return;
        const field = fields.find(f => f.id === fieldId); if (!field) return;
        const key = field.common;
        if (!aphData[key]) aphData[key] = {};
        const crop = unit.crop;
        if (!aphData[key][crop]) aphData[key][crop] = { years: {}, aphYield: unit.aphYield, aphYears: unit.aphYears };
        (unit.years || []).forEach(y => {
          aphData[key][crop].years[String(y.year)] = { acres: y.acres, yield: y.yield, production: y.production };
        });
      });
      const url = `https://agrilogix-1bd06-default-rtdb.firebaseio.com/tenants/${tenantId}/agriPlan/aphData.json?auth=${token}`;
      const res = await fetch(url, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aphData)
      });
      if (!res.ok) throw new Error(`Firebase save failed: ${res.status}`);

      // Extract price elections and save to cropPrices (insurance price only — not projected sell)
      const priceUpdates = {};
      (parsed.units || []).forEach((unit, i) => {
        const fieldId = matches[i]; if(!fieldId) return;
        const crop = unit.crop;
        if(crop && unit.priceElection > 0) {
          if(!priceUpdates[crop] || unit.priceElection > priceUpdates[crop].priceGuar) {
            priceUpdates[crop] = { priceGuar: unit.priceElection };
          }
        }
      });
      if(Object.keys(priceUpdates).length > 0) {
        // Merge with existing cropPrices (don't overwrite projected sell prices)
        const existingPrices = await fetch(
          `https://agrilogix-1bd06-default-rtdb.firebaseio.com/tenants/${tenantId}/agriPlan/cropPrices.json?auth=${token}`
        ).then(r=>r.json()).catch(()=>({}));
        const merged = {...(existingPrices||{})};
        Object.entries(priceUpdates).forEach(([crop, {priceGuar}]) => {
          merged[crop] = { ...(merged[crop]||{}), priceGuar };
        });
        await fetch(
          `https://agrilogix-1bd06-default-rtdb.firebaseio.com/tenants/${tenantId}/agriPlan/cropPrices.json?auth=${token}`,
          { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(merged) }
        ).catch(()=>{});
      }

      onImported(aphData);
      setStage("done");
    } catch (err) { setError(err.message); setStage("review"); }
  };

  const overlay = { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:4000 };
  const box = { background:"#fff", borderRadius:12, padding:28, width:720, maxHeight:"85vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", border:"1px solid #ccdda0", fontFamily:"'Barlow',sans-serif" };
  const hdr = { fontFamily:"'Playfair Display',serif", fontSize:20, color:"#1a3010", marginBottom:4 };
  const sub = { fontSize:12, color:"#7a9260", marginBottom:20 };
  const btn = (bg, fg) => ({ background:bg, color:fg, border:"none", borderRadius:6, padding:"8px 20px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" });

  return (
    <div style={overlay}>
      <div style={box}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <div style={hdr}>📥 Import APH Data</div>
            <div style={sub}>Upload your Actual Production History PDF from your crop insurance agent</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"1px solid #ccdda0", borderRadius:6, padding:"4px 12px", cursor:"pointer", color:"#7a9260", fontSize:13 }}>✕</button>
        </div>

        {error && <div style={{ background:"#fff0f0", border:"1px solid #e08080", borderRadius:6, padding:"8px 12px", marginBottom:12, fontSize:12, color:"#c02020" }}>⚠ {error}</div>}

        {stage === "upload" && (
          <div style={{ textAlign:"center", padding:"40px 20px", border:"2px dashed #b8d09a", borderRadius:8, background:"#f8fbf5" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📄</div>
            <div style={{ fontSize:14, color:"#3a6020", marginBottom:16, fontWeight:600 }}>Select your APH PDF</div>
            <div style={{ fontSize:12, color:"#7a9260", marginBottom:20 }}>PDF from your crop insurance agent — covers 10 years of yield history per field unit</div>
            <label style={{ ...btn("#2a7a18","#fff"), display:"inline-block", cursor:"pointer" }}>
              Choose PDF
              <input type="file" accept="application/pdf,.pdf" onChange={handleFile} style={{ display:"none" }} />
            </label>
          </div>
        )}

        {stage === "converting" && (
          <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{ fontSize:36, marginBottom:16, animation:"spin 1.5s linear infinite" }}>📄</div>
            <div style={{ fontSize:14, color:"#3a6020", fontWeight:600 }}>Preparing PDF...</div>
            <div style={{ fontSize:12, color:"#7a9260", marginTop:8 }}>
              {pageProgress.total > 0 ? `Converting page ${pageProgress.done} of ${pageProgress.total}` : "Loading PDF reader..."}
            </div>
          </div>
        )}

        {stage === "parsing" && (
          <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{ fontSize:36, marginBottom:16, animation:"spin 1.5s linear infinite" }}>⏳</div>
            <div style={{ fontSize:14, color:"#3a6020", fontWeight:600 }}>Reading APH data...</div>
            <div style={{ fontSize:12, color:"#7a9260", marginTop:8 }}>
              {batchProgress.total > 1
                ? `Processing batch ${Math.min(batchProgress.done+1, batchProgress.total)} of ${batchProgress.total} — large document, splitting into multiple requests`
                : "Claude is extracting field units, crops, and yield history from your PDF"}
            </div>
          </div>
        )}

        {stage === "review" && parsed && (
          <>
            <div style={{ background:"#f0f8e8", border:"1px solid #a8d880", borderRadius:6, padding:"8px 14px", marginBottom:16, fontSize:12, color:"#2a6010" }}>
              Found <strong>{parsed.units?.length}</strong> field unit{parsed.units?.length !== 1 ? "s" : ""} for <strong>{parsed.insured || "Unknown"}</strong>
              {parsed.county ? ` — ${parsed.county}` : ""}.
              {" "}<strong>{matchedCount}</strong> matched to AgriPlan fields.
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, marginBottom:16 }}>
              <thead>
                <tr style={{ background:"#1e3a18", color:"#c8e8a0" }}>
                  {["APH Field Name","Crop","Years","APH Yield","↔ Match to AgriPlan Field"].map(h => (
                    <th key={h} style={{ padding:"6px 10px", textAlign:"left", fontSize:10, textTransform:"uppercase", letterSpacing:0.6 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(parsed.units || []).map((unit, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#f6f9f0" : "#fff", borderBottom:"1px solid #e0eccc" }}>
                    <td style={{ padding:"6px 10px", color:"#1a3010", fontWeight:600 }}>{unit.fieldName || "—"}{unit.legal ? <div style={{ fontSize:10, color:"#7a9260", fontWeight:400 }}>{unit.legal}</div> : null}</td>
                    <td style={{ padding:"6px 10px" }}>
                      <span style={{ background:"#d4ecc0", color:"#1a4010", padding:"1px 7px", borderRadius:3, fontSize:11, fontWeight:600 }}>{unit.crop || "—"}</span>
                    </td>
                    <td style={{ padding:"6px 10px", color:"#527a38", fontFamily:"'IBM Plex Mono',monospace", fontSize:11 }}>
                      {unit.years?.length || 0} yrs
                      <div style={{ fontSize:10, color:"#8a9a70" }}>
                        {unit.years?.length ? `${Math.min(...unit.years.map(y=>y.year))}–${Math.max(...unit.years.map(y=>y.year))}` : ""}
                      </div>
                    </td>
                    <td style={{ padding:"6px 10px", fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:"#2a6010", fontWeight:600 }}>
                      {unit.aphYield ? `${unit.aphYield} bu/ac` : "—"}
                    </td>
                    <td style={{ padding:"6px 10px" }}>
                      <select
                        value={matches[i] || ""}
                        onChange={e => setMatches(m => ({ ...m, [i]: e.target.value }))}
                        style={{ width:"100%", border:"1px solid #b8d09a", borderRadius:4, padding:"4px 6px", fontSize:11, background:"#f8fbf5", color:"#1a3010" }}>
                        <option value="">— skip —</option>
                        {[...fields].sort((a,b)=>(a.common||"").localeCompare(b.common||"",undefined,{numeric:true,sensitivity:"base"})).map(f => <option key={f.id} value={f.id}>{f.common}{f.fieldNum ? ` #${f.fieldNum}` : ""}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={onClose} style={{ ...btn("#f8fbf5","#7a9260"), border:"1px solid #ccdda0" }}>Cancel</button>
              <button
                onClick={handleSave}
                disabled={matchedCount === 0}
                style={{ ...btn(matchedCount > 0 ? "#2a7a18" : "#aac890", "#fff") }}>
                Import {matchedCount} Field{matchedCount !== 1 ? "s" : ""}
              </button>
            </div>
          </>
        )}

        {stage === "saving" && (
          <div style={{ textAlign:"center", padding:"40px 20px" }}>
            <div style={{ fontSize:14, color:"#3a6020", fontWeight:600 }}>Saving to database...</div>
          </div>
        )}

        {stage === "done" && (
          <div style={{ textAlign:"center", padding:"40px 20px" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
            <div style={{ fontSize:16, color:"#2a6010", fontWeight:700, marginBottom:8 }}>APH data imported!</div>
            <div style={{ fontSize:12, color:"#7a9260", marginBottom:24 }}>
              {matchedCount} field unit{matchedCount !== 1 ? "s" : ""} imported. History tab is now available with crop rotation and yield data. Any price elections found in the PDF have been saved to 💲 Prices.
            </div>
            <button onClick={onClose} style={btn("#2a7a18","#fff")}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}


// ── New Year Modal ────────────────────────────────────────────────────────────
function NewYearModal({existingYears,onConfirm,onClose}){
  const nextYr = String(Math.max(...existingYears.map(Number))+1);
  const [newYear,setNewYear]=useState(nextYr);
  const [copyFrom,setCopyFrom]=useState(existingYears[existingYears.length-1]);
  const [mode,setMode]=useState("copy"); // "copy" | "blank"

  const yearValid = /^20\d{2}$/.test(newYear) && !existingYears.includes(newYear);

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
      <div style={{background:"#fff",borderRadius:12,padding:32,width:460,boxShadow:"0 20px 60px rgba(0,0,0,0.25)",border:"1px solid #ccdda0"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#1a3010",marginBottom:6}}>Start a New Year</div>
        <div style={{fontSize:12,color:"#7a9260",marginBottom:24}}>Create a new crop plan year. Your current year's data is saved and you can switch back any time.</div>

        <div style={{marginBottom:16}}>
          <label style={{fontSize:11,color:"#527a38",textTransform:"uppercase",letterSpacing:0.8,display:"block",marginBottom:6}}>New Plan Year</label>
          <input type="number" value={newYear} onChange={e=>setNewYear(e.target.value)} min="2020" max="2040"
            style={{background:"#f4f8ee",border:`2px solid ${yearValid?"#3a9020":"#cc9090"}`,borderRadius:6,padding:"10px 14px",fontSize:18,fontFamily:"'IBM Plex Mono',monospace",color:"#1a3010",width:"100%",outline:"none"}}/>
          {existingYears.includes(newYear)&&<div style={{fontSize:11,color:"#c02020",marginTop:4}}>Year {newYear} already exists — switch to it using the year selector in the header.</div>}
        </div>

        <div style={{marginBottom:20}}>
          <label style={{fontSize:11,color:"#527a38",textTransform:"uppercase",letterSpacing:0.8,display:"block",marginBottom:8}}>Starting Point</label>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <label style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",borderRadius:6,border:`2px solid ${mode==="copy"?"#3a9020":"#ccdda0"}`,cursor:"pointer",background:mode==="copy"?"#f0fce8":"#fff"}}>
              <input type="radio" checked={mode==="copy"} onChange={()=>setMode("copy")} style={{marginTop:2,accentColor:"#3a9020"}}/>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:"#1a3010"}}>Copy fields from a previous year</div>
                <div style={{fontSize:11,color:"#7a9260",marginTop:2}}>Copies all field structure, acres, and eligibility. Income and expenses reset to crop defaults — you'll update them when you get new projections.</div>
                {mode==="copy"&&(
                  <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:11,color:"#527a38"}}>Copy from:</span>
                    <select value={copyFrom} onChange={e=>setCopyFrom(e.target.value)}
                      style={{background:"#fff",border:"1px solid #b8d09a",borderRadius:4,padding:"3px 8px",fontSize:12,color:"#1a3010"}}>
                      {existingYears.map(y=><option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </label>
            <label style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",borderRadius:6,border:`2px solid ${mode==="blank"?"#3a9020":"#ccdda0"}`,cursor:"pointer",background:mode==="blank"?"#f0fce8":"#fff"}}>
              <input type="radio" checked={mode==="blank"} onChange={()=>setMode("blank")} style={{marginTop:2,accentColor:"#3a9020"}}/>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:"#1a3010"}}>Start completely blank</div>
                <div style={{fontSize:11,color:"#7a9260",marginTop:2}}>Empty field list — add fields manually or import data later.</div>
              </div>
            </label>
          </div>
        </div>

        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{background:"#fff",border:"1px solid #ccdda0",borderRadius:6,padding:"9px 20px",fontSize:12,cursor:"pointer",color:"#7a9260",fontFamily:"'Barlow',sans-serif"}}>Cancel</button>
          <button onClick={()=>yearValid&&onConfirm(newYear,mode,copyFrom)}
            disabled={!yearValid}
            style={{background:yearValid?"#2a7a18":"#ccc",border:"none",borderRadius:6,padding:"9px 24px",fontSize:12,cursor:yearValid?"pointer":"not-allowed",color:"#fff",fontFamily:"'Barlow',sans-serif",fontWeight:600}}>
            Create {newYear} Plan →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
// AgriPlan module — tenant-isolated, starts blank inside Agri Logix
export default function AgriPlanModule({ tenantId, token, userProfile, persist } = {}){
  // Configure Firebase and localStorage mode for this tenant
 _isAgriLogixTenant = !!tenantId;
  _tenantIdCache = tenantId || null;
  initAgriPlan(tenantId, token);
  const[years,setYears]=useState(()=>tenantId?["2026"]:loadYears());
  const[activeYear,setActiveYear]=useState(()=>tenantId?"2026":(()=>{const ys=loadYears();return ys[ys.length-1];})());
  const[fields,setFields]=useState(()=>tenantId?(loadTenantFieldsCache(tenantId,"2026")||[]):loadFields(loadYears().slice(-1)[0]));
  const[selectedField,setSelectedField]=useState(null);
  const[entityFilter,setEntityFilter]=useState("all");
  const[expanded,setExpanded]=useState(()=>tenantId?new Set([]):new Set([]));
  const[addMode,setAddMode]=useState(false);
  const[searchQ,setSearchQ]=useState("");
  const[mainView,setMainView]=useState("table");
  const[showNewYear,setShowNewYear]=useState(false);

  const [dbLoaded, setDbLoaded] = useState(false);
  const [showRulesEditor, setShowRulesEditor] = useState(false);
  const [showImportAPH,   setShowImportAPH]   = useState(false);
  const [aphData,         setAphData]         = useState(null); // loaded from Firebase after import
  const [fieldHistory,    setFieldHistory]    = useState({}); // manual crop history per field
  const [tenantCrops,     setTenantCrops]     = useState([]);   // per-tenant crop list
  const [showCropsMgr,   setShowCropsMgr]   = useState(false);
  const [expenseDefaults, setExpenseDefaults] = useState(_isAgriLogixTenant?{}:{...DEFAULT_RATES});
  const [cropExpDefaults, setCropExpDefaults] = useState(_isAgriLogixTenant?{}:{...CROP_EXP_DEFAULTS});
  const [showRatesEditor,  setShowRatesEditor]  = useState(false);
  const [showPricesEditor, setShowPricesEditor] = useState(false);
  const [cropPrices,       setCropPrices]       = useState({}); // {crop: {priceGuar, projPrice}}
  const [flSeedLogs,       setFlSeedLogs]       = useState({}); // {fieldName: [{date,crop,seedRate,variety}]}
  // Sync module-level vars so calc() / getRate() / CropSelect use current tenant values
  _expRates          = expenseDefaults;
  _cropRates         = cropExpDefaults;
  _tenantCrops        = tenantCrops.length > 0 ? tenantCrops : ALL_CROPS;
  _globallyIneligible = _isAgriLogixTenant ? new Set() : null;
  _aphData            = aphData;
  _fieldHistory       = fieldHistory;
  _cropPrices         = Object.keys(cropPrices).length > 0 ? cropPrices : null;
  const [fieldRestrictions,setFieldRestrictions] = useState({}); // chemical plantback data from FieldLog
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const saveTimer = useRef(null);
  const undoStack = useRef([]);
  const [canUndo, setCanUndo] = useState(false);

  useEffect(()=>{const l=document.createElement("link");l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=IBM+Plex+Mono:wght@400;500&family=Barlow:wght@300;400;500;600&display=swap";document.head.appendChild(l);},[]);

  // On mount: load once then subscribe to real-time updates
  useEffect(()=>{
    let unsubFields = null;
    let firstLoad = true;

    // Load years + hist revenue + rotation rules once
    async function loadOnce(){
      try{
        const [fbYears, fbHistRev, fbRules] = await Promise.all([
          fbLoadYears(), fbLoadHistRevenue(), fbLoadRotationRules()
        ]);
        if(fbYears&&fbYears.length>0){
          setYears(fbYears);
          localStorage.setItem("agriplan_years",JSON.stringify(fbYears));
        }
        if(fbHistRev&&Object.keys(fbHistRev).length>0){
          saveHistRevCache(fbHistRev);
        }
        if(fbRules&&Object.keys(fbRules).length>0){
          setRotationConfig(fbRules);
        }
      }catch(e){ console.warn("Firebase load failed:",e); }
    }
    loadOnce();

    // Load APH data if it exists
    if(tenantId && token) {
      fetch(`https://agrilogix-1bd06-default-rtdb.firebaseio.com/tenants/${tenantId}/agriPlan/aphData.json?auth=${token}`)
        .then(r=>r.json()).then(d=>{ if(d) setAphData(d); }).catch(()=>{});
      // Load chemical plantback restrictions written by FieldLog
      fetch(`https://agrilogix-1bd06-default-rtdb.firebaseio.com/tenants/${tenantId}/fieldRestrictions.json?auth=${token}`)
        .then(r=>r.json()).then(d=>{ if(d) setFieldRestrictions(d); }).catch(()=>{});
      // Load seeding logs from FieldLog (Default Farm) for cross-module display
      (async () => {
        try {
          const DB = "https://agrilogix-1bd06-default-rtdb.firebaseio.com";
          const [flFieldsData, flActsData] = await Promise.all([
            fetch(`${DB}/tenants/${tenantId}/fieldlog/fields.json?auth=${token}`).then(r=>r.json()),
            fetch(`${DB}/tenants/${tenantId}/fieldlog/activities.json?auth=${token}`).then(r=>r.json()),
          ]);
          // Build fieldId → name map
          const idToName = {};
          if(flFieldsData) Object.values(flFieldsData).forEach(f => { if(f?.id) idToName[f.id] = f.name; });
          // Filter seeding activities for current year, group by field name
          const yr = new Date().getFullYear();
          const logs = {};
          if(flActsData) Object.values(flActsData).forEach(a => {
            if(a?.type !== "seeding") return;
            const actYr = a.date ? new Date(a.date).getFullYear() : null;
            if(actYr !== yr) return;
            const name = idToName[a.fieldId]; if(!name) return;
            const crops = a.data?.crops?.length > 0 ? a.data.crops :
              (a.data?.crop ? [{crop: a.data.crop, seedRate: a.data.seedRate, variety: a.data.variety}] : []);
            if(!logs[name]) logs[name] = [];
            // Normalise fertilisers (new array format or legacy single-entry)
            const ferts = a.data?.ferts?.length>0 ? a.data.ferts
              : a.data?.fertBlend ? [{blend:a.data.fertBlend==="Custom Blend"?a.data.fertCustom:a.data.fertBlend,rate:a.data.fertRate,total:a.data.totalFert,placement:"Seed-placed"}]
              : [];
            // Normalise inoculants
            const inoculants = a.data?.inoculants?.length>0 ? a.data.inoculants
              : a.data?.inoculantProduct ? [{product:a.data.inoculantProduct,rate:a.data.inoculantRate}]
              : [];
            logs[name].push({
              id: a.id, date: a.date, crops, ferts, inoculants,
              equipment: a.data?.equipment, depth: a.data?.depth, notes: a.notes
            });
          });
          setFlSeedLogs(logs);
        } catch(e) { console.warn("FieldLog seed log load failed:", e.message); }
      })();
      // Load manual field history from Firebase
      fetch(`https://agrilogix-1bd06-default-rtdb.firebaseio.com/tenants/${tenantId}/agriPlan/fieldHistory.json?auth=${token}`)
        .then(r=>r.json()).then(d=>{ if(d&&typeof d==="object") setFieldHistory(d); }).catch(()=>{});
      // Load tenant crop price elections from Firebase
      fetch(`https://agrilogix-1bd06-default-rtdb.firebaseio.com/tenants/${tenantId}/agriPlan/cropPrices.json?auth=${token}`)
        .then(r=>r.json()).then(d=>{
          if(!d) return;
          if(Array.isArray(d)){
            // New array format: [{crop, priceGuar, projPrice}]
            const obj={}; d.forEach(({crop,priceGuar,projPrice})=>{ if(crop) obj[crop]={priceGuar,projPrice}; });
            setCropPrices(obj);
          } else if(typeof d==="object"){
            // Legacy object format
            setCropPrices(d);
          }
        }).catch(()=>{});
      // Load tenant crop list from Firebase
      fetch(`https://agrilogix-1bd06-default-rtdb.firebaseio.com/tenants/${tenantId}/agriPlan/crops.json?auth=${token}`)
        .then(r=>r.json()).then(d=>{ if(Array.isArray(d)&&d.length>0) setTenantCrops(d); }).catch(()=>{});
      // Load tenant-specific expense defaults (replaces hardcoded FA/VT constants)
      fetch(`https://agrilogix-1bd06-default-rtdb.firebaseio.com/tenants/${tenantId}/agriPlan/expenseDefaults.json?auth=${token}`)
        .then(r=>r.json()).then(d=>{ if(d&&typeof d==="object") setExpenseDefaults(d); }).catch(()=>{});
      fetch(`https://agrilogix-1bd06-default-rtdb.firebaseio.com/tenants/${tenantId}/agriPlan/cropExpDefaults.json?auth=${token}`)
        .then(r=>r.json()).then(d=>{ if(d&&typeof d==="object") setCropExpDefaults(d); }).catch(()=>{});
    }

    // Real-time listener for fields — fires immediately on connect, then on every change
    try{
      unsubFields = fbWatchFields(activeYear, (fbFields)=>{
        if(fbFields&&fbFields.length>0){
          // Skip our own saves (debounce: if we just saved, don't overwrite with stale data)
          // Agri Logix: always load from Firebase (fields start blank, first SSE = source of truth)
          // Standalone: skip first SSE to preserve localStorage-loaded data
          if(!firstLoad || tenantId){
            // Normalise eligibleCrops — restore script may have set it to []
            // giving all crops eligibility by default when not set
            const normalized = fbFields.filter(f=>f && typeof f==="object" && f.income && f.id!=null).map(f=>({
              ...f,
              eligibleCrops: (()=>{ const raw=f.eligibleCrops; const arr=Array.isArray(raw)?raw:raw&&typeof raw==="object"?Object.values(raw):[]; return arr.length>0?arr:(_tenantCrops||ALL_CROPS); })()
            }));
            setFields(normalized);
            if(tenantId) saveTenantFieldsCache(tenantId, activeYear, normalized);
          }
          firstLoad = false;
          if(!tenantId){ localStorage.setItem(lsKey(activeYear),JSON.stringify(fbFields)); localStorage.setItem('agriplan_data_version',DATA_VERSION); }
        }
        setDbLoaded(true);
      });
    }catch(e){
      console.warn("Firebase watch failed:",e);
      setDbLoaded(true);
    }

     // Safety net: unblock after 8s even if SSE never fires
    const fallbackTimer = setTimeout(() => {
      setDbLoaded(true);
      if(tenantId){
        setFields(prev => {
          if(prev && prev.length>0) return prev; // already have something (live or cached)
          const cached = loadTenantFieldsCache(tenantId, activeYear);
          return (cached && cached.length>0) ? cached : prev;
        });
      }
    }, 8000);

    return ()=>{ if(unsubFields) unsubFields(); clearTimeout(fallbackTimer); };
  },[activeYear]);

  const isSavingRef = useRef(false);

  // Keep selectedField in sync when fields array updates (SSE, edits, etc.)
  useEffect(()=>{
    if(!selectedField) return;
    const fresh = fields.find(f=>f.id===selectedField.id);
    if(fresh && JSON.stringify(fresh)!==JSON.stringify(selectedField)) setSelectedField(fresh);
  },[fields]);

  useEffect(()=>{
    if(fields!==null&&fields!==undefined){
      if(saveTimer.current) clearTimeout(saveTimer.current);
      setSaveStatus('saving');
      saveTimer.current = setTimeout(()=>{
        isSavingRef.current = true;
        saveFields(activeYear, fields, (status)=>{
          setSaveStatus(status);
          if(status==='saved'){
            setTimeout(()=>{ setSaveStatus('idle'); isSavingRef.current=false; }, 2000);
          } else {
            isSavingRef.current = false;
          }
        });
      }, 800);
    }
  },[fields,activeYear]);

  const switchYear=useCallback(yr=>{saveFields(activeYear,fields);setActiveYear(yr);setFields(tenantId?(loadTenantFieldsCache(tenantId,yr)||[]):loadFields(yr));setSelectedField(null);setMainView("table");setSearchQ("");},[activeYear,fields,tenantId]);
  
   // Retry any queued offline save the moment the browser comes back online —
  // same behavior AgriScale already has.
  useEffect(()=>{
    if(!tenantId) return;
    const retry = () => {
      const q = loadTenantQueue(tenantId, activeYear);
      if(!q) return;
      setSaveStatus('pushing');
      fbSaveFields(activeYear, q.fields)
        .then(()=>{ clearTenantQueue(tenantId, activeYear); setSaveStatus('saved'); setTimeout(()=>setSaveStatus('idle'),2000); })
        .catch(()=>setSaveStatus('queued'));
    };
    window.addEventListener('online', retry);
    return ()=>window.removeEventListener('online', retry);
  },[tenantId,activeYear]);
 
  const createYear=useCallback((newYr,mode,copyFromYr)=>{
    const src=mode==="copy"?(tenantId?[...fields]:loadFields(copyFromYr)):[];
    // Always blank the crop when creating a new year — user selects crops fresh
    const newFields=src.map(f=>({...f,id:`f${Date.now()}${Math.floor(Math.random()*9999)}`,crop:"",expenseOverrides:{}}));
    saveFields(newYr,newFields);
    const updatedYears=[...years,newYr].sort();
    saveYears(updatedYears);
    setYears(updatedYears);
    setShowNewYear(false);
    saveFields(activeYear,fields);
    setActiveYear(newYr);
    setFields(newFields);
    setSelectedField(null);
    setMainView("table");
  },[years,activeYear,fields]);

  const deleteYear=useCallback((yr)=>{
    if(years.length<=1){alert("Cannot delete the only year.");return;}
    // Remove from years list
    const updatedYears=years.filter(y=>y!==yr);
    saveYears(updatedYears);
    setYears(updatedYears);
    // Clear localStorage for this year (standalone only)
    if(!_isAgriLogixTenant){ try{ localStorage.removeItem(lsKey(yr)); }catch{} }
    // Switch to most recent remaining year
    const switchTo=updatedYears[updatedYears.length-1];
    setActiveYear(switchTo);
    setFields(loadFields(switchTo));
    setSelectedField(null);
    setMainView("table");
  },[years]);
  const filtered=useMemo(()=>{let fs=fields;if(entityFilter!=="all")fs=fs.filter(f=>f.entity===entityFilter);if(searchQ){const q=searchQ.toLowerCase();fs=fs.filter(f=>f.common?.toLowerCase().includes(q)||f.farm?.toLowerCase().includes(q)||f.crop?.toLowerCase().includes(q)||f.legal?.toLowerCase().includes(q));}return fs;},[fields,entityFilter,searchQ]);
  const totals=useMemo(()=>filtered.reduce((a,f)=>{const c=calc(f);return{acres:a.acres+f.acres,revenue:a.revenue+c.revenue,guarantee:a.guarantee+c.guarantee,expenses:a.expenses+c.expenses,net:a.net+c.net};},{acres:0,revenue:0,guarantee:0,expenses:0,net:0}),[filtered]);
  const farmGroups=useMemo(()=>{const g={};filtered.forEach(f=>{const k=`${f.entity}::${f.farm}`;if(!g[k])g[k]={entity:f.entity,farm:f.farm,fields:[]};g[k].fields.push(f);});const cmp=(a,b)=>(a||"").localeCompare(b||"",undefined,{numeric:true,sensitivity:"base"});const groups=Object.values(g);groups.forEach(grp=>grp.fields.sort((a,b)=>cmp(a.common,b.common)));groups.sort((a,b)=>cmp(a.farm,b.farm)||cmp(a.entity,b.entity));return groups;},[filtered]);
  const pushUndo = useCallback((prev)=>{
    undoStack.current=[...undoStack.current.slice(-19),prev]; // keep last 20
    setCanUndo(true);
  },[]);
  const handleUndo = useCallback(()=>{
    if(undoStack.current.length===0) return;
    const prev=undoStack.current.pop();
    setFields(prev);
    if(undoStack.current.length===0) setCanUndo(false);
  },[]);
  const updateField=useCallback((id,upd)=>setFields(p=>{pushUndo(p);return p.map(f=>f.id===id?{...f,...upd}:f);}),[pushUndo]);
  const updateIncome=useCallback((id,k,v)=>setFields(p=>{pushUndo(p);return p.map(f=>f.id===id?{...f,income:{...f.income,[k]:+v}}:f);}),[pushUndo]);
  const updateExpense=useCallback((id,k,v)=>setFields(p=>{pushUndo(p);return p.map(f=>f.id===id?{...f,expenseOverrides:{...(f.expenseOverrides||{}),[k]:+v}}:f);}),[pushUndo]);
  const resetExpense=useCallback((id,k)=>setFields(p=>p.map(f=>{if(f.id!==id)return f;const ov={...(f.expenseOverrides||{})};delete ov[k];return{...f,expenseOverrides:ov};})),[]);
  const deleteField=useCallback(id=>{
    setFields(p=>{
      const remaining=p.filter(f=>f.id!==id);
      // Save immediately — auto-save misses this if remaining is empty
      saveFields(activeYear, remaining, (s)=>setSaveStatus(s));
      // Also remove from FieldLog Default Farm if it was synced there
      const deleted=p.find(f=>f.id===id);
      if(deleted&&tenantId&&token){(async()=>{
        try{
          const DB="https://agrilogix-1bd06-default-rtdb.firebaseio.com";
          const data=await fetch(`${DB}/tenants/${tenantId}/fieldlog/fields.json?auth=${token}`).then(r=>r.json());
          if(!data) return;
          const match=Object.entries(data).find(([,f])=>f.name===deleted.common);
          if(match){
            await fetch(`${DB}/tenants/${tenantId}/fieldlog/fields/${match[0]}.json?auth=${token}`,{method:"DELETE"});
            console.log(`[SYNC] Deleted "${deleted.common}" from AgriField`);
          }
        }catch(e){console.warn("Delete sync to AgriField failed:",e.message);}
      })();}
      return remaining;
    });
    setSelectedField(null);setMainView("table");
  },[activeYear,tenantId,token]);
  const addField=useCallback(nf=>{
    const field={...nf,id:`f${Date.now()}${Math.floor(Math.random()*9999)}`};
    setFields(p=>[...p,field]);setAddMode(false);setSelectedField(field);setMainView("detail");
    // ── Sync to FieldLog — update existing (keep boundary) or add to Default Farm ──
    if(tenantId&&token){(async()=>{
      const DB="https://agrilogix-1bd06-default-rtdb.firebaseio.com";
      const norm=s=>(s||"").trim().toLowerCase();
      try{
        // Get all farm paths (Default + named farms)
        const farmsData=await fetch(`${DB}/tenants/${tenantId}/farms.json?auth=${token}&shallow=true`).then(r=>r.json()).catch(()=>null);
        const farmPaths=[`tenants/${tenantId}/fieldlog`];
        if(farmsData&&typeof farmsData==="object") Object.keys(farmsData).forEach(id=>farmPaths.push(`tenants/${tenantId}/farms/${id}/fieldlog`));
        // Search all farms for existing field by name
        let matchPath=null, matchKey=null, matchField=null;
        for(const p of farmPaths){
          const d=await fetch(`${DB}/${p}/fields.json?auth=${token}`).then(r=>r.json()).catch(()=>null);
          if(!d) continue;
          const entry=Object.entries(d).find(([,f])=>norm(f?.name)===norm(field.common));
          if(entry){ matchPath=p; matchKey=entry[0]; matchField=entry[1]; break; }
        }
        if(matchField){
          // Field exists — update info but KEEP boundary, lat/lng, and all other FieldLog data
          const updated={
            ...matchField,                              // preserve everything (boundary, activities, etc.)
            acres: String(field.acres||matchField.acres||""),
            legalDesc: field.legal||matchField.legalDesc||"",
            notes: field.farm ? `Farm: ${field.farm}` : (matchField.notes||""),
          };
          await fetch(`${DB}/${matchPath}/fields/${matchKey}.json?auth=${token}`,{
            method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(updated)
          });
          console.log(`[SYNC] Updated "${field.common}" in AgriField — boundary preserved`);
        } else {
          // Not found anywhere — add to Default Farm
          const flId=`fl${Date.now()}${Math.floor(Math.random()*9999)}`;
          await fetch(`${DB}/tenants/${tenantId}/fieldlog/fields/${flId}.json?auth=${token}`,{
            method:"PUT",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({id:flId,name:field.common,acres:String(field.acres||""),legalDesc:field.legal||"",notes:field.farm?`Farm: ${field.farm}`:"",boundary:[]})
          });
          console.log(`[SYNC] "${field.common}" → AgriField Default Farm (new)`);
        }
      }catch(e){console.warn("AgriPlan→AgriField sync failed:",e.message);}
    })();}
  },[tenantId,token]);
  const selectField=f=>{setSelectedField(typeof f==="object"?f:fields.find(x=>x.id===f)||null);setMainView("detail");setAddMode(false);};

  return(<div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#f1f5eb",color:"#1a3010",fontFamily:"'Barlow',sans-serif",overflow:"hidden"}}>
    {showRulesEditor&&<RotationRulesEditor onClose={()=>setShowRulesEditor(false)}/>}
    {!dbLoaded&&<div style={{position:"fixed",inset:0,background:"rgba(241,245,235,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}>
      <div style={{fontSize:28}}>🌾</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#2a5a18"}}>Loading AgriPlan...</div>
      <div style={{fontSize:12,color:"#7a9260"}}>Syncing with database</div>
    </div>}
    {showNewYear&&<NewYearModal existingYears={years} onConfirm={createYear} onClose={()=>setShowNewYear(false)}/> }
    {showPricesEditor&&<CropPricesModal
      tenantId={tenantId} token={token}
      tenantCrops={tenantCrops} cropPrices={cropPrices}
      onSave={p=>setCropPrices(p)}
      onClose={()=>setShowPricesEditor(false)}/>}
    {showCropsMgr&&<ManageCropsModal
      tenantId={tenantId} token={token} tenantCrops={tenantCrops}
      onSave={crops=>setTenantCrops(crops)}
      onClose={()=>setShowCropsMgr(false)}/>}
    {showRatesEditor&&<ExpenseDefaultsModal
      tenantId={tenantId} token={token}
      expenseDefaults={expenseDefaults} cropExpDefaults={cropExpDefaults}
      onSave={(base,crops)=>{ setExpenseDefaults(base); setCropExpDefaults(crops); }}
      onClose={()=>setShowRatesEditor(false)}/>}
    {showImportAPH&&<ImportAPHModal tenantId={tenantId} token={token} fields={fields} onClose={()=>setShowImportAPH(false)} onImported={(data)=>{setAphData(data);setShowImportAPH(false);}}/>}
    {/* Header */}
    <div style={{background:"#1e3a18",borderBottom:"1px solid #2a5020",padding:"0 20px",display:"flex",alignItems:"center",gap:16,height:52,flexShrink:0}}>
      <span style={{fontFamily:"'Playfair Display',serif",fontSize:19,color:"#c8e8a0",letterSpacing:0.5}}>🌾 AgriPlan</span>
      <span style={{fontSize:10,color:"#7aaa60",borderLeft:"1px solid #3a6020",paddingLeft:12,textTransform:"uppercase",letterSpacing:1.5}}>Farm Income &amp; Expense Planner</span>
      {/* Year switcher */}
      <div style={{display:"flex",alignItems:"center",background:"rgba(255,255,255,0.08)",borderRadius:6,padding:"2px 4px",gap:2}}>
        {years.map(yr=>(
          <div key={yr} style={{display:"flex",alignItems:"center",borderRadius:4,background:yr===activeYear?"#4a9030":"transparent",transition:"background 0.15s"}}>
            <button onClick={()=>switchYear(yr)}
              style={{padding:"3px 10px",border:"none",cursor:"pointer",fontSize:12,fontWeight:yr===activeYear?700:400,
                background:"transparent",color:yr===activeYear?"#e8fce0":"#8ac870",
                fontFamily:"'IBM Plex Mono',monospace",borderRadius:4}}>
              {yr}
            </button>
            {years.length>1&&(
              <button onClick={()=>{if(window.confirm(`Delete the ${yr} plan? This cannot be undone.`)) deleteYear(yr);}}
                title={`Delete ${yr} plan`}
                style={{padding:"1px 4px",border:"none",background:"transparent",cursor:"pointer",
                  color:yr===activeYear?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.2)",fontSize:10,lineHeight:1,
                  borderRadius:3}}
                onMouseEnter={e=>e.currentTarget.style.color="#ff9090"}
                onMouseLeave={e=>e.currentTarget.style.color=yr===activeYear?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.2)"}>
                ✕
              </button>
            )}
          </div>
        ))}
        <button onClick={()=>setShowNewYear(true)}
          title="Start a new plan year"
          style={{padding:"3px 8px",borderRadius:4,border:"1px dashed rgba(255,255,255,0.3)",cursor:"pointer",fontSize:13,
            background:"transparent",color:"#7aaa60",marginLeft:2,lineHeight:1}}>
          +
        </button>
      </div>
      <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
        {canUndo&&<button onClick={handleUndo} title="Undo last change" style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:4,padding:"4px 10px",color:"#a8d880",fontSize:10,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>↩ Undo</button>}
        {saveStatus==='saving'&&<span style={{fontSize:10,color:"#90c870",opacity:0.8}}>⟳ Saving...</span>}
        <button onClick={()=>setShowRulesEditor(true)} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:4,padding:"4px 10px",color:"#a8d880",fontSize:10,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}} title="Edit rotation rules">⚙ Rotation Rules</button>
        {saveStatus==='saved'&&<span style={{fontSize:10,color:"#90e870"}}>✓ Saved</span>}
        {saveStatus==='queued'&&<span style={{fontSize:11,color:"#ffb060",background:"rgba(255,150,50,0.15)",padding:"3px 10px",borderRadius:4,border:"1px solid #ffb060"}} title="Saved on this device — will sync automatically when signal returns">⚠ Offline — saved locally</span>}
        {saveStatus==='error'&&<span style={{fontSize:11,color:"#ff6050",background:"rgba(255,80,50,0.15)",padding:"3px 10px",borderRadius:4,border:"1px solid #ff6050",cursor:"pointer"}} title="Click to retry" onClick={()=>saveFields(activeYear,fields,(s)=>setSaveStatus(s))}>⚠ Save failed — tap to retry</span>}
        <button onClick={()=>{setMainView("table");setSelectedField(null);setAddMode(false);}} style={{background:mainView==="table"&&!addMode?"#2a5a18":"rgba(255,255,255,0.08)",border:"1px solid #3a6028",borderRadius:4,padding:"5px 12px",color:"#a8d880",fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>All Fields</button>
        {(!tenantId||aphData||Object.keys(fieldHistory||{}).length>0)&&<button onClick={()=>{setMainView("history");setSelectedField(null);setAddMode(false);}} style={{background:mainView==="history"?"#2a5a18":"rgba(255,255,255,0.08)",border:"1px solid #3a6028",borderRadius:4,padding:"5px 12px",color:"#a8d880",fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>📅 History</button>}
        <button onClick={()=>{setMainView("expenses");setSelectedField(null);setAddMode(false);}} style={{background:mainView==="expenses"?"#2a5a18":"rgba(255,255,255,0.08)",border:"1px solid #3a6028",borderRadius:4,padding:"5px 12px",color:"#a8d880",fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>💰 Expenses</button>
        <button onClick={()=>{setAddMode(true);setMainView("add");setSelectedField(null);}} style={{background:"#4a9030",border:"none",borderRadius:4,padding:"5px 14px",color:"#e8fce0",fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>+ Add Field</button>
        {tenantId&&<button onClick={()=>setShowImportAPH(true)} style={{background:"rgba(255,255,255,0.08)",border:"1px solid #3a6028",borderRadius:4,padding:"5px 12px",color:"#a8d880",fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>📥 Import APH</button>}
        {tenantId&&<button onClick={()=>setShowRatesEditor(true)} style={{background:"rgba(255,255,255,0.08)",border:"1px solid #3a6028",borderRadius:4,padding:"5px 12px",color:"#a8d880",fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>⚙️ Rates</button>}
        {tenantId&&<button onClick={()=>setShowCropsMgr(true)} style={{background:"rgba(255,255,255,0.08)",border:"1px solid #3a6028",borderRadius:4,padding:"5px 12px",color:"#a8d880",fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>🌾 Crops</button>}
        {tenantId&&<button onClick={()=>setShowPricesEditor(true)} style={{background:"rgba(255,255,255,0.08)",border:"1px solid #3a6028",borderRadius:4,padding:"5px 12px",color:"#a8d880",fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>💲 Prices</button>}
        <button onClick={()=>exportCSV(filtered)} style={{background:"rgba(255,255,255,0.1)",border:"1px solid #4a7a40",borderRadius:4,padding:"5px 12px",color:"#90d898",fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>↓ CSV</button>
        <button onClick={()=>openPrint(filtered,entityFilter)} style={{background:"rgba(255,255,255,0.1)",border:"1px solid #4a6a7a",borderRadius:4,padding:"5px 12px",color:"#90b8d8",fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>🖨 Budget PDF</button>
      </div>
    </div>

    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      {/* Sidebar */}
      <div style={{width:235,background:"#e6eed8",borderRight:"1px solid #162016",overflowY:"auto",flexShrink:0,display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",gap:4,padding:"8px 10px",borderBottom:"1px solid #162016"}}>
          {[["all","All"],...([...new Set(fields.map(f=>f.entity))].filter(Boolean).map(e=>[e,e.length>8?e.slice(0,7)+"…":e]))].map(([v,l])=>(<button key={v} onClick={()=>setEntityFilter(v)} style={{flex:1,fontSize:10,padding:"4px 0",borderRadius:3,border:"none",cursor:"pointer",background:entityFilter===v?"#2a7a18":"#eef4e6",color:entityFilter===v?"#ffffff":"#6a8a50",fontWeight:entityFilter===v?700:400,fontFamily:"'Barlow',sans-serif"}}>{l}</button>))}
        </div>
        <div style={{padding:"6px 10px",borderBottom:"1px solid #162016"}}>
          <input placeholder="🔍 search..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{background:"#ffffff",border:"1px solid #1e3020",borderRadius:4,padding:"4px 8px",color:"#1a7010",fontFamily:"'Barlow',sans-serif",fontSize:11,width:"100%",outline:"none"}}/>
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {farmGroups.map(g=>{
            const k=`${g.entity}::${g.farm}`;const open=expanded.has(k);
            const acres=g.fields.reduce((s,f)=>s+f.acres,0);const hasOv=g.fields.some(f=>Object.keys(f.expenseOverrides||{}).length>0);
            return(<div key={k}>
              <div onClick={()=>setExpanded(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n;})} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",cursor:"pointer",fontSize:10,color:"#1a4010",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,background:"#e4f0d0",borderBottom:"1px solid #162016"}}>
                <span style={{fontSize:8}}>{open?"▾":"▸"}</span>
                <span style={{flex:1}}>{g.farm}</span>
                {hasOv&&<span title="One or more fields have custom expense overrides" style={{color:"#8a6010",fontSize:9}}>★</span>}
                <span style={{color:"#2a5020",fontSize:9,fontWeight:600}}>{acres.toFixed(0)}ac</span>
              </div>
              {open&&g.fields.map(f=>{const act=selectedField&&f.id===selectedField.id;const inelig=(_globallyIneligible||GLOBALLY_INELIGIBLE).has(f.crop)||!(f.eligibleCrops||[]).includes(f.crop);const hasOv=Object.keys(f.expenseOverrides||{}).length>0;
                return(<div key={f.id} onClick={()=>selectField(f)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px 5px 18px",cursor:"pointer",fontSize:11,background:act?"#d4ecc0":"transparent",color:act?"#1a7010":"#527a38",borderLeft:`2px solid ${act?"#3a9020":"transparent"}`}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:inelig?"#c02020":"#3a9020",flexShrink:0}}/>
                  <span style={{flex:1,lineHeight:1.3,wordBreak:"break-word"}}>{f.common}{f.fieldNum&&String(f.fieldNum).trim()?<span style={{fontSize:9,color:"#7a9a60",marginLeft:4}}>#{f.fieldNum}</span>:null}</span>
                  {hasOv&&<span title="This field has custom expense overrides — see Expenses tab to review or reset" style={{color:"#8a6010",fontSize:9}}>★</span>}
                  <span style={{fontSize:9,color:"#7a9260",flexShrink:0}}>{f.acres.toFixed(0)}ac</span>
                </div>);
              })}
            </div>);
          })}
        </div>
        {/* Crop breakdown */}
        <div style={{borderTop:"1px solid #162016",padding:"8px 10px"}}>
          <div style={{fontSize:9,color:"#3a7028",textTransform:"uppercase",letterSpacing:0.8,marginBottom:5}}>Crop Acres (filtered)</div>
          {(()=>{const cm={};filtered.forEach(f=>{cm[f.crop]=(cm[f.crop]||0)+f.acres;});return Object.entries(cm).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([c,ac])=>(<div key={c} style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#527a38",padding:"1px 0"}}><span>{c}</span><span style={{color:"#7a9260"}}>{ac.toFixed(0)}</span></div>));})()}
        </div>
      </div>

      {/* Main content */}
      <div style={{flex:1,overflowY:"auto",padding:20,background:"#f1f5eb"}}>
        {/* Summary strip */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
          <SCard label="Acres" val={totals.acres.toFixed(0)+" ac"} color="#2a7010" sub={`${filtered.length} field units`}/>
          <SCard label="Projected Revenue" val={f$(totals.revenue)} color="#1a7010" sub={`$${f2(totals.revenue/(totals.acres||1))}/ac avg`}/>
          <SCard label="Ins. Guarantee" val={f$(totals.guarantee)} color="#7a6010" sub={`$${f2(totals.guarantee/(totals.acres||1))}/ac avg`}/>
          <SCard label="Total Expenses" val={f$(totals.expenses)} color="#c05010" sub={`$${f2(totals.expenses/(totals.acres||1))}/ac avg`}/>
          <SCard label="Net Income" val={f$(totals.net,true)} color={totals.net>=0?"#1a7010":"#c02020"} sub="revenue − expenses"/>
        </div>
        {addMode?(<AddFieldForm onSave={addField} onCancel={()=>{setAddMode(false);setMainView("table");}}/>)
          :mainView==="history"&&(!tenantId||aphData||Object.keys(fieldHistory||{}).length>0)?(<HistoryView fields={filtered} allFields={fields} onSelectField={id=>{selectField(id);}} aphData={aphData} fieldHistory={fieldHistory} />)
          :mainView==="expenses"?(<FarmExpensesView fields={fields} activeYear={activeYear} onApplyExpenses={(entity,rates)=>{pushUndo(fields);setFields(p=>p.map(f=>f.entity===entity?{...f,expenseOverrides:{...(f.expenseOverrides||{}),...rates}}:f));}} />)
          :mainView==="detail"&&selectedField?(<FieldDetail field={selectedField} onUpdateIncome={updateIncome} onUpdateExpense={updateExpense} onResetExpense={resetExpense} onUpdate={updateField} onDelete={deleteField} activeYear={activeYear} allFields={fields} years={years} createYear={createYear} switchYear={switchYear} fieldRestrictions={fieldRestrictions} tenantId={tenantId} token={token} fieldHistory={fieldHistory} flSeedLogs={flSeedLogs} onSaveFieldHistory={(common,hist)=>{
            const updated={...fieldHistory,[common]:hist};
            setFieldHistory(updated);
            if(tenantId&&token) fetch(`https://agrilogix-1bd06-default-rtdb.firebaseio.com/tenants/${tenantId}/agriPlan/fieldHistory.json?auth=${token}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(updated)}).catch(()=>{});
          }}/>)
          :(<FieldsTable fields={filtered} onSelect={selectField} onExportCSV={()=>exportCSV(filtered)} onPrint={()=>openPrint(filtered,entityFilter)} seedLogs={flSeedLogs}/>)}
      </div>
    </div>
  </div>);
}
