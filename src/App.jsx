import React, { useState, useEffect, useRef, useCallback } from "react";

const FBMT_CSS_B64 = [
  "KiwqOjpiZWZvcmUsKjo6YWZ0ZXJ7Ym94LXNpemluZzpib3JkZXItYm94O21hcmdpbjowO3BhZGRpbmc6MDt9CmJvZHl7Zm9udC1m",
  "YW1pbHk6J1NvdXJjZSBTYW5zIDMnLHNhbnMtc2VyaWY7fQouYXBwe2ZvbnQtZmFtaWx5OidTb3VyY2UgU2FucyAzJyxzYW5zLXNl",
  "cmlmO2JhY2tncm91bmQ6I2Y5ZjVmNTttaW4taGVpZ2h0OjEwMHZoO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47",
  "fQoudG9wLWJhcntiYWNrZ3JvdW5kOiM2QjBFMUU7Y29sb3I6d2hpdGU7cGFkZGluZzoxMnB4IDI0cHg7ZGlzcGxheTpmbGV4O2Fs",
  "aWduLWl0ZW1zOmNlbnRlcjtnYXA6MTJweDt9Ci50b3AtYmFyIC5iYW5rLW5hbWV7Zm9udC1mYW1pbHk6J1BsYXlmYWlyIERpc3Bs",
  "YXknLHNlcmlmO2ZvbnQtc2l6ZToxLjFyZW07bGV0dGVyLXNwYWNpbmc6LjA0ZW07fQoudG9wLWJhciAuZGl2aWRlcntvcGFjaXR5",
  "Oi40O2ZvbnQtc2l6ZToxLjJyZW07fQoudG9wLWJhciAudG9vbC1uYW1le2ZvbnQtc2l6ZTouODVyZW07b3BhY2l0eTouNzU7dGV4",
  "dC10cmFuc2Zvcm06dXBwZXJjYXNlO2xldHRlci1zcGFjaW5nOi4xZW07fQoudGFiLWJhcntkaXNwbGF5OmZsZXg7YmFja2dyb3Vu",
  "ZDojNGEwODEwO3BhZGRpbmc6MCAyNHB4O2dhcDo0cHg7fQoudGFiLWJ0bntiYWNrZ3JvdW5kOm5vbmU7Ym9yZGVyOm5vbmU7Y29s",
  "b3I6cmdiYSgyNTUsMjU1LDI1NSwuNik7Zm9udC1mYW1pbHk6J1NvdXJjZSBTYW5zIDMnLHNhbnMtc2VyaWY7Zm9udC1zaXplOi45",
  "cmVtO2ZvbnQtd2VpZ2h0OjYwMDtwYWRkaW5nOjEycHggMjJweDtjdXJzb3I6cG9pbnRlcjtib3JkZXItYm90dG9tOjNweCBzb2xp",
  "ZCB0cmFuc3BhcmVudDt0cmFuc2l0aW9uOmFsbCAuMTVzO30KLnRhYi1idG46aG92ZXJ7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwu",
  "OSk7fQoudGFiLWFjdGl2ZXtjb2xvcjp3aGl0ZSFpbXBvcnRhbnQ7Ym9yZGVyLWJvdHRvbS1jb2xvcjojZThhMGFhIWltcG9ydGFu",
  "dDtiYWNrZ3JvdW5kOnJnYmEoMjU1LDI1NSwyNTUsLjA4KTtib3JkZXItcmFkaXVzOjZweCA2cHggMCAwO30KLnByb2dyZXNzLWJh",
  "ci13cmFwe2JhY2tncm91bmQ6IzVhMGMxODtwYWRkaW5nOjAgMjRweCAxMHB4O30KLnByb2dyZXNzLWxhYmVse2NvbG9yOnJnYmEo",
  "MjU1LDI1NSwyNTUsLjYpO2ZvbnQtc2l6ZTouNzJyZW07dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlO2xldHRlci1zcGFjaW5nOi4x",
  "ZW07cGFkZGluZy10b3A6NnB4O21hcmdpbi1ib3R0b206NHB4O30KLnByb2dyZXNzLXRyYWNre2hlaWdodDo0cHg7YmFja2dyb3Vu",
  "ZDpyZ2JhKDI1NSwyNTUsMjU1LC4xNSk7Ym9yZGVyLXJhZGl1czoycHg7b3ZlcmZsb3c6aGlkZGVuO30KLnByb2dyZXNzLWZpbGx7",
  "aGVpZ2h0OjEwMCU7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoOTBkZWcsI2MwMzk0ZCwjZThhMGFhKTtib3JkZXItcmFkaXVz",
  "OjJweDt0cmFuc2l0aW9uOndpZHRoIC40cyBlYXNlO30KLm1haW57ZGlzcGxheTpmbGV4O2ZsZXg6MTtnYXA6MjBweDttYXgtd2lk",
  "dGg6MTQwMHB4O21hcmdpbjowIGF1dG87d2lkdGg6MTAwJTtwYWRkaW5nOjI0cHggMTZweDt9Ci5zaWRlYmFye3dpZHRoOjIwMHB4",
  "O2ZsZXgtc2hyaW5rOjA7b3ZlcmZsb3cteTphdXRvO30KLnNpZGViYXItc2VjdGlvbnttYXJnaW4tYm90dG9tOjE2cHg7fQouc2lk",
  "ZWJhci1zZWN0aW9uLWxhYmVse2ZvbnQtc2l6ZTouNjhyZW07dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlO2xldHRlci1zcGFjaW5n",
  "Oi4xMmVtO2NvbG9yOiM4ODg7cGFkZGluZzo0cHggMTBweDttYXJnaW4tYm90dG9tOjRweDtmb250LXdlaWdodDo3MDA7fQouc2lk",
  "ZWJhci1pdGVte3BhZGRpbmc6NnB4IDEwcHg7Ym9yZGVyLXJhZGl1czo2cHg7Zm9udC1zaXplOi44MnJlbTtjb2xvcjojNTU1O2N1",
  "cnNvcjpwb2ludGVyO3RyYW5zaXRpb246YWxsIC4xNXM7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6NnB4O30K",
  "LnNpZGViYXItaXRlbTpob3ZlcntiYWNrZ3JvdW5kOnJnYmEoMCwwLDAsLjA2KTt9Ci5zaWRlYmFyLWl0ZW0uYWN0aXZle2JhY2tn",
  "cm91bmQ6IzZCMEUxRTtjb2xvcjp3aGl0ZTtmb250LXdlaWdodDo2MDA7fQouc2lkZWJhci1pdGVtLmRvbmV7Y29sb3I6IzZCMEUx",
  "RTt9Ci5zaWRlYmFyLWl0ZW0uZG9uZTo6YmVmb3Jle2NvbnRlbnQ6ImNoZWNrbWFyayAiO2ZvbnQtc2l6ZTouN3JlbTt9Ci5jYXJk",
  "e2ZsZXg6MTtiYWNrZ3JvdW5kOndoaXRlO2JvcmRlci1yYWRpdXM6MTJweDtib3gtc2hhZG93OjAgMnB4IDIwcHggcmdiYSgwLDAs",
  "MCwuMDgpO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47bWluLWhlaWdodDo1MjBweDt9Ci5jYXJkLWJvZHl7Zmxl",
  "eDoxO3BhZGRpbmc6MjhweCAzNnB4O292ZXJmbG93LXk6YXV0bzt9Ci5jYXJkLW5hdntkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6",
  "Y2VudGVyO2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2dhcDoxMnB4O3BhZGRpbmctYm90dG9tOjE2cHg7bWFyZ2luLWJv",
  "dHRvbToyMHB4O2JvcmRlci1ib3R0b206MXB4IHNvbGlkICNlZWU7fQouY2FyZC1jb250ZW50e2ZsZXg6MTt9Ci5jYXJkLWZvb3Rl",
  "cntib3JkZXItdG9wOjFweCBzb2xpZCAjZWVlO3BhZGRpbmc6MTZweCAzMnB4O2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50",
  "ZXI7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47Z2FwOjEycHg7fQoucmlnaHQtcGFuZWx7d2lkdGg6MjAwcHg7ZmxleC1z",
  "aHJpbms6MDt9Ci5ydW5uaW5nLXRvdGFse2JhY2tncm91bmQ6IzZCMEUxRTtib3JkZXItcmFkaXVzOjEwcHg7cGFkZGluZzoxNnB4",
  "O2NvbG9yOndoaXRlO3Bvc2l0aW9uOnN0aWNreTt0b3A6MjRweDt9Ci5ydC1pdGVte2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlv",
  "bjpjb2x1bW47bWFyZ2luLWJvdHRvbToxMnB4O30KLnJ0LWl0ZW0gc3Bhbntmb250LXNpemU6LjcycmVtO29wYWNpdHk6LjY1O3Rl",
  "eHQtdHJhbnNmb3JtOnVwcGVyY2FzZTtsZXR0ZXItc3BhY2luZzouMDhlbTt9Ci5ydC1pdGVtIHN0cm9uZ3tmb250LXNpemU6MS4w",
  "NXJlbTtmb250LXdlaWdodDo2MDA7fQoucnQtaXRlbS5uZXR7Ym9yZGVyLXRvcDoxcHggc29saWQgcmdiYSgyNTUsMjU1LDI1NSwu",
  "Mik7cGFkZGluZy10b3A6MTBweDt9Ci5ydC1pdGVtLm5ldCBzdHJvbmd7Zm9udC1zaXplOjEuMnJlbTt9Ci5ncmVlbntjb2xvcjoj",
  "ZThhMGFhO30KLnJlZHtjb2xvcjojZmZhYWFhO30KLnN0ZXAtY29udGVudHtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29s",
  "dW1uO2dhcDoxNnB4O30KLnNlY3Rpb24taGVhZGVye2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpmbGV4LXN0YXJ0O2dhcDoxNHB4",
  "O2JvcmRlci1sZWZ0OjRweCBzb2xpZCAjNkIwRTFFO3BhZGRpbmctbGVmdDoxNHB4O21hcmdpbi1ib3R0b206OHB4O30KLnNlY3Rp",
  "b24taWNvbntmb250LXNpemU6MS42cmVtO2xpbmUtaGVpZ2h0OjE7bWFyZ2luLXRvcDoycHg7fQouc2VjdGlvbi1oZWFkZXIgaDJ7",
  "Zm9udC1mYW1pbHk6J1BsYXlmYWlyIERpc3BsYXknLHNlcmlmO2ZvbnQtc2l6ZToxLjNyZW07Y29sb3I6IzFhMWExYTtmb250LXdl",
  "aWdodDo2MDA7fQouc3VidGl0bGV7Zm9udC1zaXplOi44NXJlbTtjb2xvcjojNjY2O21hcmdpbi10b3A6M3B4O30KLmlucHV0LWdy",
  "b3Vwe2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47Z2FwOjRweDt9Ci5pbnB1dC1ncm91cCBsYWJlbHtmb250LXNp",
  "emU6LjhyZW07dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlO2xldHRlci1zcGFjaW5nOi4wN2VtO2NvbG9yOiM1NTU7Zm9udC13ZWln",
  "aHQ6NjAwO30KLmhpbnR7Zm9udC1zaXplOi43NXJlbTtjb2xvcjojODg4O30KLmlucHV0LXdyYXB7ZGlzcGxheTpmbGV4O2FsaWdu",
  "LWl0ZW1zOmNlbnRlcjtib3JkZXI6MS41cHggc29saWQgI2RkZDtib3JkZXItcmFkaXVzOjdweDtvdmVyZmxvdzpoaWRkZW47YmFj",
  "a2dyb3VuZDojZmFmYWZhO30KLmlucHV0LXdyYXA6Zm9jdXMtd2l0aGlue2JvcmRlci1jb2xvcjojNkIwRTFFO2JhY2tncm91bmQ6",
  "d2hpdGU7fQoucHJlZml4e3BhZGRpbmc6MTBweCAxMnB4O2JhY2tncm91bmQ6I2Y5ZjVmNTtib3JkZXItcmlnaHQ6MS41cHggc29s",
  "aWQgI2RkZDtmb250LXNpemU6Ljk1cmVtO2NvbG9yOiM2NjY7Zm9udC13ZWlnaHQ6NjAwO30KLmlucHV0LXdyYXAgaW5wdXR7Zmxl",
  "eDoxO2JvcmRlcjpub25lO2JhY2tncm91bmQ6dHJhbnNwYXJlbnQ7cGFkZGluZzoxMHB4IDE0cHg7Zm9udC1zaXplOjFyZW07Zm9u",
  "dC1mYW1pbHk6J1NvdXJjZSBTYW5zIDMnLHNhbnMtc2VyaWY7Y29sb3I6IzFhMWExYTtvdXRsaW5lOm5vbmU7fQppbnB1dC50ZXh0",
  "LWlucHV0e2JvcmRlcjoxLjVweCBzb2xpZCAjZGRkO2JvcmRlci1yYWRpdXM6N3B4O3BhZGRpbmc6MTBweCAxNHB4O2ZvbnQtc2l6",
  "ZToxcmVtO2ZvbnQtZmFtaWx5OidTb3VyY2UgU2FucyAzJyxzYW5zLXNlcmlmO2NvbG9yOiMxYTFhMWE7b3V0bGluZTpub25lO3dp",
  "ZHRoOjEwMCU7YmFja2dyb3VuZDojZmFmYWZhO30KaW5wdXQudGV4dC1pbnB1dDpmb2N1c3tib3JkZXItY29sb3I6IzZCMEUxRTti",
  "YWNrZ3JvdW5kOndoaXRlO30KLnJvdy1lbnRyeXtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6ZmxleC1lbmQ7Z2FwOjEycHg7cGFk",
  "ZGluZzoxNHB4IDEycHg7YmFja2dyb3VuZDojZjhmNmYyO2JvcmRlci1yYWRpdXM6OHB4O2JvcmRlcjoxcHggc29saWQgI2U4ZTRk",
  "YztmbGV4LXdyYXA6d3JhcDt9Ci5yb3ctbnVte3dpZHRoOjIwcHg7dGV4dC1hbGlnbjpjZW50ZXI7Zm9udC1zaXplOi43NXJlbTtj",
  "b2xvcjojOTk5O2ZvbnQtd2VpZ2h0OjcwMDtwYWRkaW5nLWJvdHRvbToxMHB4O2ZsZXgtc2hyaW5rOjA7fQoucm93LWVudHJ5ID4g",
  "LmlucHV0LWdyb3Vwe2ZsZXg6MTttaW4td2lkdGg6MTIwcHg7fQoucmVtb3ZlLWJ0bntiYWNrZ3JvdW5kOm5vbmU7Ym9yZGVyOjFw",
  "eCBzb2xpZCAjZGRkO2JvcmRlci1yYWRpdXM6NXB4O3BhZGRpbmc6NXB4IDhweDtjdXJzb3I6cG9pbnRlcjtjb2xvcjojYzQ0O2Zv",
  "bnQtc2l6ZTouNzVyZW07ZmxleC1zaHJpbms6MDttYXJnaW4tYm90dG9tOjFweDt9Ci5yZW1vdmUtYnRuOmhvdmVye2JhY2tncm91",
  "bmQ6I2ZlZTtib3JkZXItY29sb3I6I2M0NDt9Ci5hZGQtYnRue2FsaWduLXNlbGY6ZmxleC1zdGFydDtiYWNrZ3JvdW5kOm5vbmU7",
  "Ym9yZGVyOjEuNXB4IGRhc2hlZCAjNkIwRTFFO2JvcmRlci1yYWRpdXM6N3B4O3BhZGRpbmc6OHB4IDE2cHg7Y29sb3I6IzZCMEUx",
  "RTtmb250LXNpemU6Ljg1cmVtO2ZvbnQtZmFtaWx5OidTb3VyY2UgU2FucyAzJyxzYW5zLXNlcmlmO2N1cnNvcjpwb2ludGVyO2Zv",
  "bnQtd2VpZ2h0OjYwMDt0cmFuc2l0aW9uOmFsbCAuMTVzO30KLmFkZC1idG46aG92ZXJ7YmFja2dyb3VuZDojNkIwRTFFO2NvbG9y",
  "OndoaXRlO30KLnN1YnRvdGFsLXJvd3tkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47YWxpZ24taXRl",
  "bXM6Y2VudGVyO3BhZGRpbmc6OHB4IDEycHg7YmFja2dyb3VuZDojZjlmNWY1O2JvcmRlci1yYWRpdXM6NnB4O2ZvbnQtc2l6ZTou",
  "OXJlbTtjb2xvcjojNDQ0O2JvcmRlci1sZWZ0OjNweCBzb2xpZCAjY2NjO30KLnN1YnRvdGFsLXJvdy50b3RhbHtiYWNrZ3JvdW5k",
  "OiNmNWU4ZWE7Ym9yZGVyLWxlZnQtY29sb3I6IzZCMEUxRTtmb250LXdlaWdodDo3MDA7Zm9udC1zaXplOi45NXJlbTt9Ci5zdWJ0",
  "b3RhbC1yb3cgc3Ryb25ne2ZvbnQtd2VpZ2h0OjcwMDt9Ci5maWVsZC1ub3Rle2ZvbnQtc2l6ZTouODJyZW07Y29sb3I6Izc3Nztm",
  "b250LXN0eWxlOml0YWxpYztiYWNrZ3JvdW5kOiNmOGY2ZjI7cGFkZGluZzo4cHggMTJweDtib3JkZXItcmFkaXVzOjZweDt9Ci5w",
  "aGFzZS1iYWRnZXtmb250LXNpemU6Ljc4cmVtO2JhY2tncm91bmQ6IzZCMEUxRTtjb2xvcjp3aGl0ZTtwYWRkaW5nOjRweCAxMnB4",
  "O2JvcmRlci1yYWRpdXM6MjBweDtkaXNwbGF5OmlubGluZS1ibG9jaztmb250LXdlaWdodDo2MDA7bGV0dGVyLXNwYWNpbmc6LjA0",
  "ZW07fQouaW50cm8tdGV4dHtmb250LXNpemU6Ljk1cmVtO2NvbG9yOiM1NTU7bGluZS1oZWlnaHQ6MS42O30KLmZwLWhlYWRlci1y",
  "b3d7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6OHB4O3BhZGRpbmc6MCA0cHg7fQouZnAtY29sLWxhYmVse2Zv",
  "bnQtc2l6ZTouNjhyZW07dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlO2xldHRlci1zcGFjaW5nOi4wOGVtO2NvbG9yOiM4ODg7Zm9u",
  "dC13ZWlnaHQ6NzAwO30KLmZwLXJvd3tkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo4cHg7cGFkZGluZzoxMnB4",
  "O2JhY2tncm91bmQ6I2Y4ZjZmMjtib3JkZXItcmFkaXVzOjhweDtib3JkZXI6MXB4IHNvbGlkICNlOGU0ZGM7fQoudW5pdC1zZWxl",
  "Y3R7d2lkdGg6MTAwJTtib3JkZXI6MS41cHggc29saWQgI2RkZDtib3JkZXItcmFkaXVzOjdweDtwYWRkaW5nOjEwcHggNnB4O2Zv",
  "bnQtc2l6ZTouOTVyZW07Zm9udC1mYW1pbHk6J1NvdXJjZSBTYW5zIDMnLHNhbnMtc2VyaWY7YmFja2dyb3VuZDojZmFmYWZhO2Nv",
  "bG9yOiMxYTFhMWE7b3V0bGluZTpub25lO2N1cnNvcjpwb2ludGVyO30KLnVuaXQtc2VsZWN0OmZvY3Vze2JvcmRlci1jb2xvcjoj",
  "NkIwRTFFO2JhY2tncm91bmQ6d2hpdGU7fQouZnAtY2FsYy10b3RhbHtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dh",
  "cDo0cHg7YmFja2dyb3VuZDojZjVlOGVhO2JvcmRlci1yYWRpdXM6NnB4O3BhZGRpbmc6OHB4IDEwcHg7fQouZnAtZXF1YWxze2Nv",
  "bG9yOiM4ODg7Zm9udC1zaXplOi44NXJlbTt9Ci5mcC1yZXN1bHR7Zm9udC13ZWlnaHQ6NzAwO2ZvbnQtc2l6ZTouODhyZW07Y29s",
  "b3I6IzZCMEUxRTt9Ci5tYWNoLXRhYmxle2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47Z2FwOjRweDt9Ci5tYWNo",
  "LWhlYWRlcntkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo2cHg7cGFkZGluZzo0cHggNnB4O30KLm1hY2gtaGVh",
  "ZGVyIHNwYW57Zm9udC1zaXplOi42OHJlbTt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2U7bGV0dGVyLXNwYWNpbmc6LjA4ZW07Y29s",
  "b3I6Izg4ODtmb250LXdlaWdodDo3MDA7fQoubWFjaC1yb3d7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6OHB4",
  "O3BhZGRpbmc6MTJweCAxMHB4O2JhY2tncm91bmQ6I2Y4ZjZmMjtib3JkZXItcmFkaXVzOjdweDtib3JkZXI6MXB4IHNvbGlkICNl",
  "OGU0ZGM7ZmxleC13cmFwOndyYXA7fQoubWFjaC1jb2x7ZGlzcGxheTpmbGV4O30KLm1hY2gtY29sIC50ZXh0LWlucHV0e3dpZHRo",
  "OjEwMCU7fQoubWFjaC1jb2wgLmlucHV0LXdyYXB7d2lkdGg6MTAwJTt9Ci5zdW1tYXJ5LWdyaWR7ZGlzcGxheTpncmlkO2dyaWQt",
  "dGVtcGxhdGUtY29sdW1uczoxZnIgMWZyO2dhcDoyMHB4O21hcmdpbi10b3A6OHB4O30KLmNvbC1oZWFke2ZvbnQtZmFtaWx5OidQ",
  "bGF5ZmFpciBEaXNwbGF5JyxzZXJpZjtmb250LXNpemU6MXJlbTtmb250LXdlaWdodDo3MDA7bGV0dGVyLXNwYWNpbmc6LjA1ZW07",
  "dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlO3BhZGRpbmc6OHB4IDEycHg7bWFyZ2luLWJvdHRvbToxMHB4O2JvcmRlci1yYWRpdXM6",
  "NnB4O30KLmFzc2V0cy1oZWFke2JhY2tncm91bmQ6I2Y1ZThlYTtjb2xvcjojNkIwRTFFO30KLmxpYWItaGVhZHtiYWNrZ3JvdW5k",
  "OiNmY2U4ZTg7Y29sb3I6IzRhMDgxMDt9Ci5zdW1tYXJ5LXNlY3Rpb257bWFyZ2luLWJvdHRvbToxMnB4O30KLnNzLWxhYmVse2Zv",
  "bnQtc2l6ZTouNzJyZW07dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlO2xldHRlci1zcGFjaW5nOi4xZW07Y29sb3I6Izk5OTtmb250",
  "LXdlaWdodDo3MDA7bWFyZ2luLWJvdHRvbTo2cHg7cGFkZGluZzowIDRweDt9Ci5zcy1yb3d7ZGlzcGxheTpmbGV4O2p1c3RpZnkt",
  "Y29udGVudDpzcGFjZS1iZXR3ZWVuO2ZvbnQtc2l6ZTouODJyZW07Y29sb3I6IzQ0NDtwYWRkaW5nOjNweCA2cHg7Ym9yZGVyLWJv",
  "dHRvbToxcHggc29saWQgI2YwZWNlNDt9Ci5zcy1yb3cuc3Vie2NvbG9yOiM4ODg7Zm9udC1zaXplOi43OHJlbTtwYWRkaW5nLWxl",
  "ZnQ6MTZweDt9Ci5zcy1zdWJ0b3RhbHtkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47Zm9udC1zaXpl",
  "Oi44NXJlbTtmb250LXdlaWdodDo3MDA7Y29sb3I6IzMzMztwYWRkaW5nOjVweCA2cHg7YmFja2dyb3VuZDojZjVmM2VmO2JvcmRl",
  "ci1yYWRpdXM6NHB4O21hcmdpbi10b3A6NHB4O30KLnNzLXRvdGFse2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2Ut",
  "YmV0d2Vlbjtmb250LXNpemU6MXJlbTtmb250LXdlaWdodDo3MDA7cGFkZGluZzoxMHB4IDhweDtib3JkZXItcmFkaXVzOjZweDtt",
  "YXJnaW4tdG9wOjhweDt9Ci5ncmVlbi10b3RhbHtiYWNrZ3JvdW5kOiNmNWU4ZWE7Y29sb3I6IzZCMEUxRTt9Ci5yZWQtdG90YWx7",
  "YmFja2dyb3VuZDojZmNlOGU4O2NvbG9yOiM0YTA4MTA7fQoubmV0LXNlY3Rpb257bWFyZ2luLXRvcDoxNnB4O2JvcmRlci10b3A6",
  "MnB4IHNvbGlkICNlZWU7cGFkZGluZy10b3A6MTJweDtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2dhcDo4cHg7",
  "fQoubmV0LXJvd3tkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47YWxpZ24taXRlbXM6Y2VudGVyO3Bh",
  "ZGRpbmc6NHB4IDZweDt9Ci5uZXQtcm93Lm53e2ZvbnQtc2l6ZToxLjFyZW07Zm9udC13ZWlnaHQ6NzAwO2NvbG9yOiMxYTFhMWE7",
  "fQoubmV0LXJvdyAuZ3JlZW57Y29sb3I6IzZCMEUxRTt9Ci5uZXQtcm93IC5yZWR7Y29sb3I6I2M0NDt9Ci5zYXZlLWJhcntkaXNw",
  "bGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMnB4O21hcmdpbi10b3A6MTRweDtwYWRkaW5nOjE0cHggMTZweDtiYWNr",
  "Z3JvdW5kOiNmNWU4ZWE7Ym9yZGVyLXJhZGl1czoxMHB4O2JvcmRlcjoxcHggc29saWQgI2UwYzBjNTtmbGV4LXdyYXA6d3JhcDt9",
  "Ci5zYXZlLWRhdGUtd3JhcHtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo4cHg7ZmxleDoxO30KLnNhdmUtZGF0",
  "ZS13cmFwIGxhYmVse2ZvbnQtc2l6ZTouNzhyZW07Zm9udC13ZWlnaHQ6NzAwO3RleHQtdHJhbnNmb3JtOnVwcGVyY2FzZTtsZXR0",
  "ZXItc3BhY2luZzouMDdlbTtjb2xvcjojNkIwRTFFO3doaXRlLXNwYWNlOm5vd3JhcDt9Ci5idG57cGFkZGluZzoxMHB4IDI0cHg7",
  "Ym9yZGVyLXJhZGl1czo4cHg7Zm9udC1mYW1pbHk6J1NvdXJjZSBTYW5zIDMnLHNhbnMtc2VyaWY7Zm9udC1zaXplOi45cmVtO2Zv",
  "bnQtd2VpZ2h0OjYwMDtjdXJzb3I6cG9pbnRlcjt0cmFuc2l0aW9uOmFsbCAuMTVzO2JvcmRlcjpub25lO30KLmJ0bi1wcmltYXJ5",
  "e2JhY2tncm91bmQ6IzZCMEUxRTtjb2xvcjp3aGl0ZTt9Ci5idG4tcHJpbWFyeTpob3ZlcntiYWNrZ3JvdW5kOiM1YTBjMTg7fQou",
  "YnRuLXNlY29uZGFyeXtiYWNrZ3JvdW5kOiNmOWY1ZjU7Y29sb3I6IzU1NTtib3JkZXI6MXB4IHNvbGlkICNkZGQ7fQouYnRuLXNl",
  "Y29uZGFyeTpob3ZlcntiYWNrZ3JvdW5kOiNmMGVjZTQ7fQouYnRuLXN1Y2Nlc3N7YmFja2dyb3VuZDojMmQ3YTNhO2NvbG9yOndo",
  "aXRlO30KLmJ0bi1zdWNjZXNzOmhvdmVye2JhY2tncm91bmQ6IzI1NjAzMDt9Ci5idG4tc2F2ZXtiYWNrZ3JvdW5kOiM2QjBFMUU7",
  "Y29sb3I6d2hpdGU7Ym9yZGVyOm5vbmU7fQouYnRuLXNhdmU6aG92ZXJ7YmFja2dyb3VuZDojNWEwYzE4O30KLmJ0bi1zYXZlOmRp",
  "c2FibGVke29wYWNpdHk6LjY7Y3Vyc29yOmRlZmF1bHQ7fQouc3RlcC1pbmZve2ZvbnQtc2l6ZTouNzhyZW07Y29sb3I6Izk5OTt9",
  "Ci5wcmludC1ub3Rle2ZvbnQtc2l6ZTouODJyZW07Y29sb3I6Izc3NztiYWNrZ3JvdW5kOiNmOGY2ZjI7cGFkZGluZzoxMnB4IDE2",
  "cHg7Ym9yZGVyLXJhZGl1czo4cHg7bWFyZ2luLXRvcDo4cHg7Ym9yZGVyLWxlZnQ6M3B4IHNvbGlkICNjY2M7fQouaG9tZS10b3B7",
  "YmFja2dyb3VuZDojNkIwRTFFO2NvbG9yOndoaXRlO3BhZGRpbmc6MjBweCAzMnB4O2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpj",
  "ZW50ZXI7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47fQouaG9tZS10b3AtdGl0bGV7Zm9udC1mYW1pbHk6J1BsYXlmYWly",
  "IERpc3BsYXknLHNlcmlmO2ZvbnQtc2l6ZToxLjNyZW07bGV0dGVyLXNwYWNpbmc6LjA0ZW07fQouaG9tZS10b3Atc3Vie2ZvbnQt",
  "c2l6ZTouOHJlbTtvcGFjaXR5Oi43O21hcmdpbi10b3A6MnB4O3RleHQtdHJhbnNmb3JtOnVwcGVyY2FzZTtsZXR0ZXItc3BhY2lu",
  "ZzouMWVtO30KLmhvbWUtYm9keXttYXgtd2lkdGg6ODAwcHg7bWFyZ2luOjAgYXV0bztwYWRkaW5nOjQwcHggMjRweDt3aWR0aDox",
  "MDAlO30KLmhvbWUtbmV3LWJ0bntiYWNrZ3JvdW5kOiM2QjBFMUU7Y29sb3I6d2hpdGU7Ym9yZGVyOm5vbmU7Ym9yZGVyLXJhZGl1",
  "czoxMHB4O3BhZGRpbmc6MTZweCAzMnB4O2ZvbnQtc2l6ZToxcmVtO2ZvbnQtZmFtaWx5OidTb3VyY2UgU2FucyAzJyxzYW5zLXNl",
  "cmlmO2ZvbnQtd2VpZ2h0OjcwMDtjdXJzb3I6cG9pbnRlcjtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMHB4",
  "O21hcmdpbi1ib3R0b206MzZweDt0cmFuc2l0aW9uOmJhY2tncm91bmQgLjE1czt9Ci5ob21lLW5ldy1idG46aG92ZXJ7YmFja2dy",
  "b3VuZDojNWEwYzE4O30KLmhvbWUtc2VjdGlvbi1sYWJlbHtmb250LXNpemU6LjcycmVtO3RleHQtdHJhbnNmb3JtOnVwcGVyY2Fz",
  "ZTtsZXR0ZXItc3BhY2luZzouMTJlbTtjb2xvcjojODg4O2ZvbnQtd2VpZ2h0OjcwMDttYXJnaW4tYm90dG9tOjEycHg7fQouaG9t",
  "ZS1lbXB0eXtiYWNrZ3JvdW5kOndoaXRlO2JvcmRlci1yYWRpdXM6MTJweDtwYWRkaW5nOjMycHg7dGV4dC1hbGlnbjpjZW50ZXI7",
  "Y29sb3I6I2FhYTtmb250LXNpemU6Ljk1cmVtO2JvcmRlcjoycHggZGFzaGVkICNlMGQ4ZDg7fQouc2hlZXQtY2FyZHtiYWNrZ3Jv",
  "dW5kOndoaXRlO2JvcmRlci1yYWRpdXM6MTBweDtib3JkZXI6MXB4IHNvbGlkICNlOGUwZTA7cGFkZGluZzoxOHB4IDIwcHg7bWFy",
  "Z2luLWJvdHRvbToxMHB4O2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjE2cHg7dHJh",
  "bnNpdGlvbjphbGwgLjE1cztib3gtc2hhZG93OjAgMXB4IDRweCByZ2JhKDAsMCwwLC4wNSk7fQouc2hlZXQtY2FyZDpob3Zlcnti",
  "b3JkZXItY29sb3I6IzZCMEUxRTtib3gtc2hhZG93OjAgMnB4IDEycHggcmdiYSgxMDcsMTQsMzAsLjEyKTt0cmFuc2Zvcm06dHJh",
  "bnNsYXRlWSgtMXB4KTt9Ci5zaGVldC1pY29ue2ZvbnQtc2l6ZToxLjhyZW07ZmxleC1zaHJpbms6MDt9Ci5zaGVldC1pbmZve2Zs",
  "ZXg6MTt9Ci5zaGVldC1uYW1le2ZvbnQtc2l6ZToxcmVtO2ZvbnQtd2VpZ2h0OjcwMDtjb2xvcjojMWExYTFhO21hcmdpbi1ib3R0",
  "b206M3B4O30KLnNoZWV0LW1ldGF7Zm9udC1zaXplOi44cmVtO2NvbG9yOiM4ODg7fQouc2hlZXQtZGF0ZXtmb250LXNpemU6Ljgy",
  "cmVtO2ZvbnQtd2VpZ2h0OjYwMDtjb2xvcjojNkIwRTFFO30KLnNoZWV0LWRlbGV0ZXtiYWNrZ3JvdW5kOm5vbmU7Ym9yZGVyOjFw",
  "eCBzb2xpZCAjZGRkO2JvcmRlci1yYWRpdXM6NnB4O3BhZGRpbmc6NnB4IDEwcHg7Y3Vyc29yOnBvaW50ZXI7Y29sb3I6I2M0NDtm",
  "b250LXNpemU6Ljc1cmVtO2ZsZXgtc2hyaW5rOjA7dHJhbnNpdGlvbjphbGwgLjE1czt9Ci5zaGVldC1kZWxldGU6aG92ZXJ7YmFj",
  "a2dyb3VuZDojZmVlO2JvcmRlci1jb2xvcjojYzQ0O30KLnNoZWV0LWxvYWQtYnRue2JhY2tncm91bmQ6IzZCMEUxRTtjb2xvcjp3",
  "aGl0ZTtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjZweDtwYWRkaW5nOjdweCAxNnB4O2ZvbnQtc2l6ZTouODJyZW07Zm9udC1m",
  "YW1pbHk6J1NvdXJjZSBTYW5zIDMnLHNhbnMtc2VyaWY7Zm9udC13ZWlnaHQ6NjAwO2N1cnNvcjpwb2ludGVyO2ZsZXgtc2hyaW5r",
  "OjA7dHJhbnNpdGlvbjpiYWNrZ3JvdW5kIC4xNXM7fQouc2hlZXQtbG9hZC1idG46aG92ZXJ7YmFja2dyb3VuZDojNWEwYzE4O30K",
  "LmJ1ZGdldC1wYWdle2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47ZmxleDoxO292ZXJmbG93OmhpZGRlbjt9Ci5i",
  "dWRnZXQtdG9wLWJhcntiYWNrZ3JvdW5kOndoaXRlO2JvcmRlci1ib3R0b206MXB4IHNvbGlkICNlOGUwZTA7cGFkZGluZzoxMnB4",
  "IDI0cHg7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MjBweDtmbGV4LXdyYXA6d3JhcDt9Ci5idWRnZXQtY2xp",
  "ZW50e2ZvbnQtZmFtaWx5OidQbGF5ZmFpciBEaXNwbGF5JyxzZXJpZjtmb250LXNpemU6MXJlbTtmb250LXdlaWdodDo2MDA7Y29s",
  "b3I6IzFhMWExYTt9Ci5idWRnZXQtdG9wLXRvdGFsc3tkaXNwbGF5OmZsZXg7Z2FwOjIwcHg7fQouYnR0LWl0ZW17ZGlzcGxheTpm",
  "bGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjthbGlnbi1pdGVtczpjZW50ZXI7fQouYnR0LWl0ZW0gc3Bhbntmb250LXNpemU6LjY4",
  "cmVtO3RleHQtdHJhbnNmb3JtOnVwcGVyY2FzZTtsZXR0ZXItc3BhY2luZzouMDhlbTtjb2xvcjojODg4O30KLmJ0dC1pdGVtIHN0",
  "cm9uZ3tmb250LXNpemU6MXJlbTtmb250LXdlaWdodDo3MDA7fQouYnR0LW5ldHtib3JkZXItbGVmdDoxcHggc29saWQgI2VlZTtw",
  "YWRkaW5nLWxlZnQ6MjBweDt9Ci5idWRnZXQtYm9keXtmbGV4OjE7b3ZlcmZsb3cteTphdXRvO3BhZGRpbmc6MjBweCAyNHB4O30K",
  "LmJ1ZGdldC13cmFwe2Rpc3BsYXk6Z3JpZDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6MWZyIDFmcjtnYXA6MjBweDt9Ci5idWRnZXQt",
  "c2VjdGlvbntiYWNrZ3JvdW5kOndoaXRlO2JvcmRlci1yYWRpdXM6MTJweDtib3gtc2hhZG93OjAgMnB4IDEycHggcmdiYSgwLDAs",
  "MCwuMDcpO292ZXJmbG93OmhpZGRlbjtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO30KLmJ1ZGdldC1zZWN0aW9u",
  "LWhlYWR7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2FsaWduLWl0ZW1zOmNlbnRlcjtwYWRkaW5n",
  "OjE0cHggMThweDtmb250LWZhbWlseTonUGxheWZhaXIgRGlzcGxheScsc2VyaWY7Zm9udC1zaXplOjFyZW07Zm9udC13ZWlnaHQ6",
  "NzAwO2xldHRlci1zcGFjaW5nOi4wNGVtO30KLmluY29tZS1oZWFke2JhY2tncm91bmQ6I2U4ZjVlYTtjb2xvcjojMWE1YzI1O2Jv",
  "cmRlci1ib3R0b206MnB4IHNvbGlkICNiOGRmYzA7fQouZXhwZW5zZS1oZWFke2JhY2tncm91bmQ6I2ZjZThlODtjb2xvcjojN2Ex",
  "YTFhO2JvcmRlci1ib3R0b206MnB4IHNvbGlkICNmMGMwYzA7fQouYnNoLXRvdGFse2ZvbnQtc2l6ZToxLjFyZW07fQouYnVkZ2V0",
  "LXN1YnNlY3Rpb257cGFkZGluZzoxNHB4IDE2cHg7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgI2YwZWNlODt9Ci5idWRnZXQtc3Vi",
  "LWxhYmVse2ZvbnQtc2l6ZTouN3JlbTt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2U7bGV0dGVyLXNwYWNpbmc6LjFlbTtjb2xvcjoj",
  "ODg4O2ZvbnQtd2VpZ2h0OjcwMDttYXJnaW4tYm90dG9tOjEwcHg7fQouYmctaGVhZGVyLXJvd3tkaXNwbGF5OmZsZXg7YWxpZ24t",
  "aXRlbXM6Y2VudGVyO2dhcDo2cHg7cGFkZGluZzowIDRweDttYXJnaW4tYm90dG9tOjRweDt9Ci5iZy1jb2wtbGFiZWx7Zm9udC1z",
  "aXplOi42NXJlbTt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2U7bGV0dGVyLXNwYWNpbmc6LjA4ZW07Y29sb3I6I2FhYTtmb250LXdl",
  "aWdodDo3MDA7fQouYmctcm93e2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjhweDtwYWRkaW5nOjExcHggOHB4",
  "O2JhY2tncm91bmQ6I2Y4ZjZmMjtib3JkZXItcmFkaXVzOjdweDtib3JkZXI6MXB4IHNvbGlkICNlZGU4ZTI7bWFyZ2luLWJvdHRv",
  "bTo1cHg7fQouYnVkZ2V0LXN1YnRvdGFse2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2VlbjtwYWRkaW5n",
  "OjhweCAxMHB4O2JhY2tncm91bmQ6I2Y1ZjNlZjtib3JkZXItcmFkaXVzOjZweDtmb250LXNpemU6Ljg1cmVtO2ZvbnQtd2VpZ2h0",
  "OjYwMDtjb2xvcjojNDQ0O21hcmdpbi10b3A6OHB4O30KLmJ1ZGdldC1ncmFuZHtkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50",
  "OnNwYWNlLWJldHdlZW47YWxpZ24taXRlbXM6Y2VudGVyO3BhZGRpbmc6MTRweCAxOHB4O2ZvbnQtd2VpZ2h0OjcwMDtmb250LXNp",
  "emU6MXJlbTtsZXR0ZXItc3BhY2luZzouMDNlbTt9Ci5pbmNvbWUtZ3JhbmR7YmFja2dyb3VuZDojMWE1YzI1O2NvbG9yOndoaXRl",
  "O30KLmV4cGVuc2UtZ3JhbmR7YmFja2dyb3VuZDojN2ExYTFhO2NvbG9yOndoaXRlO30KLmJ1ZGdldC1uZXR7ZGlzcGxheTpmbGV4",
  "O2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2FsaWduLWl0ZW1zOmNlbnRlcjtwYWRkaW5nOjE0cHggMThweDtmb250LXdl",
  "aWdodDo3MDA7Zm9udC1zaXplOjEuMDVyZW07Ym9yZGVyLXRvcDoycHggc29saWQgI2VlZTt9Ci5uZXQtcG9zaXRpdmV7YmFja2dy",
  "b3VuZDojZThmNWVhO2NvbG9yOiMxYTVjMjU7fQoubmV0LW5lZ2F0aXZle2JhY2tncm91bmQ6I2ZjZThlODtjb2xvcjojN2ExYTFh",
  "O30KLm1hcmdpbi1kZXRhaWx7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtnYXA6M3B4O30KLm1hcmdpbi1sYWJl",
  "bHtmb250LXNpemU6Ljk1cmVtO2ZvbnQtd2VpZ2h0OjcwMDt9Ci5tYXJnaW4tY2FsY3tmb250LXNpemU6LjcycmVtO2ZvbnQtd2Vp",
  "Z2h0OjQwMDtvcGFjaXR5Oi43O30KLm1hcmdpbi12YWx1ZXtmb250LXNpemU6MS4ycmVtO2ZvbnQtd2VpZ2h0OjgwMDt9Ci5kZWJ0",
  "LWVtcHR5e2ZvbnQtc2l6ZTouOHJlbTtjb2xvcjojYWFhO2ZvbnQtc3R5bGU6aXRhbGljO3BhZGRpbmc6OHB4IDRweDt9Ci5kZWJ0",
  "LWNhdGVnb3J5LWxhYmVse2ZvbnQtc2l6ZTouNjhyZW07dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlO2xldHRlci1zcGFjaW5nOi4w",
  "OGVtO2NvbG9yOiM5OTk7Zm9udC13ZWlnaHQ6NzAwO21hcmdpbjo4cHggMCA0cHg7cGFkZGluZzowIDRweDt9Ci5kZWJ0LXJvd3tk",
  "aXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo4cHg7cGFkZGluZzo1cHggOHB4O2JhY2tncm91bmQ6I2YwZWNlODti",
  "b3JkZXItcmFkaXVzOjZweDttYXJnaW4tYm90dG9tOjNweDtib3JkZXItbGVmdDozcHggc29saWQgIzZCMEUxRTt9Ci5kZWJ0LWNy",
  "ZWRpdG9ye2ZsZXg6MTtmb250LXNpemU6Ljg1cmVtO2ZvbnQtd2VpZ2h0OjYwMDtjb2xvcjojMmEyYTJhO30KLmRlYnQtZGV0YWls",
  "e2ZvbnQtc2l6ZTouNzVyZW07Y29sb3I6Izg4ODt9Ci5kZWJ0LWFtb3VudHtmb250LXNpemU6Ljg4cmVtO2ZvbnQtd2VpZ2h0Ojcw",
  "MDtjb2xvcjojNkIwRTFFO21pbi13aWR0aDo4MHB4O3RleHQtYWxpZ246cmlnaHQ7fQouY29tcC1wYWdle2Rpc3BsYXk6ZmxleDtm",
  "bGV4LWRpcmVjdGlvbjpjb2x1bW47ZmxleDoxO292ZXJmbG93OmhpZGRlbjt9Ci5jb21wLXBhZ2UtaGVhZGVye2JhY2tncm91bmQ6",
  "d2hpdGU7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgI2U4ZTBlMDtwYWRkaW5nOjE0cHggMjRweDtkaXNwbGF5OmZsZXg7YWxpZ24t",
  "aXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO30KLmNvbXAtcGFnZS10aXRsZXtmb250LWZhbWlseTon",
  "UGxheWZhaXIgRGlzcGxheScsc2VyaWY7Zm9udC1zaXplOjEuMDVyZW07Zm9udC13ZWlnaHQ6NzAwO2NvbG9yOiMxYTFhMWE7fQou",
  "Y29tcC1wYWdlLXN1Yntmb250LXNpemU6Ljc4cmVtO2NvbG9yOiM4ODg7bWFyZ2luLXRvcDoycHg7fQouY29tcC1zY3JvbGx7Zmxl",
  "eDoxO292ZXJmbG93LXk6YXV0bztvdmVyZmxvdy14OmF1dG87cGFkZGluZzoyMHB4IDI0cHg7fQouY29tcC13cmFwe2Rpc3BsYXk6",
  "ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47Z2FwOjI0cHg7fQouY29tcC1sb2FkaW5ne3BhZGRpbmc6NDBweDt0ZXh0LWFsaWdu",
  "OmNlbnRlcjtjb2xvcjojODg4O2ZvbnQtc2l6ZTouOTVyZW07fQouY29tcC1lbXB0eXtiYWNrZ3JvdW5kOndoaXRlO2JvcmRlci1y",
  "YWRpdXM6MTBweDtwYWRkaW5nOjMycHg7dGV4dC1hbGlnbjpjZW50ZXI7Y29sb3I6Izg4ODtib3JkZXI6MnB4IGRhc2hlZCAjZTBk",
  "OGQ4O30KLmNvbXAtZW1wdHkgcHttYXJnaW4tYm90dG9tOjhweDtmb250LXNpemU6LjlyZW07bGluZS1oZWlnaHQ6MS42O30KLmNv",
  "bXAtdGFibGUtd3JhcHtvdmVyZmxvdy14OmF1dG87Ym9yZGVyLXJhZGl1czoxMHB4O2JveC1zaGFkb3c6MCAycHggMTJweCByZ2Jh",
  "KDAsMCwwLC4wNyk7fQouY29tcC10YWJsZXt3aWR0aDoxMDAlO2JvcmRlci1jb2xsYXBzZTpjb2xsYXBzZTtiYWNrZ3JvdW5kOndo",
  "aXRlO2ZvbnQtc2l6ZTouODJyZW07fQouY29tcC10aHtiYWNrZ3JvdW5kOiM2QjBFMUU7Y29sb3I6d2hpdGU7cGFkZGluZzoxMHB4",
  "IDE0cHg7Zm9udC1zaXplOi43NXJlbTt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2U7bGV0dGVyLXNwYWNpbmc6LjA3ZW07Zm9udC13",
  "ZWlnaHQ6NzAwO3doaXRlLXNwYWNlOm5vd3JhcDt9Ci5jb21wLWxhYmVsLXRoe3RleHQtYWxpZ246bGVmdDttaW4td2lkdGg6MTgw",
  "cHg7fQouY29tcC15ZWFyLXRoe3RleHQtYWxpZ246cmlnaHQ7bWluLXdpZHRoOjExMHB4O30KLmNvbXAtY2hnLXRoe3RleHQtYWxp",
  "Z246cmlnaHQ7bWluLXdpZHRoOjEyMHB4O2ZvbnQtc2l6ZTouNjhyZW07bGluZS1oZWlnaHQ6MS4zO30KLmNvbXAtdHJlbmQtdGh7",
  "dGV4dC1hbGlnbjpjZW50ZXI7bWluLXdpZHRoOjYwcHg7fQouY29tcC1zZWN0aW9uLWhlYWQgdGR7YmFja2dyb3VuZDojZjVlOGVh",
  "O2NvbG9yOiM2QjBFMUU7Zm9udC1zaXplOi42OHJlbTt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2U7bGV0dGVyLXNwYWNpbmc6LjFl",
  "bTtmb250LXdlaWdodDo4MDA7cGFkZGluZzo1cHggMTRweDtib3JkZXItdG9wOjJweCBzb2xpZCAjZTBjMGM1O30KLmNvbXAtcm93",
  "e2JvcmRlci1ib3R0b206MXB4IHNvbGlkICNmNWYwZjA7fQouY29tcC1yb3c6aG92ZXJ7YmFja2dyb3VuZDojZmRmOWY5O30KLmNv",
  "bXAtYm9sZC1yb3d7YmFja2dyb3VuZDojZjVlOGVhIWltcG9ydGFudDt9Ci5jb21wLWJvbGQtcm93OmhvdmVye2JhY2tncm91bmQ6",
  "I2YwZTBlMyFpbXBvcnRhbnQ7fQouY29tcC1icmVhay1yb3cgdGR7Ym9yZGVyLWJvdHRvbToycHggc29saWQgI2QwYTBhODt9Ci5j",
  "b21wLWxhYmVse3BhZGRpbmc6N3B4IDE0cHg7Y29sb3I6IzMzMztmb250LXNpemU6LjgycmVtO3doaXRlLXNwYWNlOm5vd3JhcDt9",
  "Ci5jb21wLWJvbGQtcm93IC5jb21wLWxhYmVse2ZvbnQtd2VpZ2h0OjcwMDtjb2xvcjojNkIwRTFFO2ZvbnQtc2l6ZTouODVyZW07",
  "fQouY29tcC12YWx7cGFkZGluZzo3cHggMTRweDt0ZXh0LWFsaWduOnJpZ2h0O2ZvbnQtZmFtaWx5Om1vbm9zcGFjZTtmb250LXNp",
  "emU6LjgycmVtO2NvbG9yOiMxYTFhMWE7d2hpdGUtc3BhY2U6bm93cmFwO30KLmNvbXAtYm9sZC12YWx7Zm9udC13ZWlnaHQ6NzAw",
  "O2ZvbnQtc2l6ZTouODhyZW07fQouY29tcC16ZXJve2NvbG9yOiNjY2M7fQouY29tcC1uZWd7Y29sb3I6I2M0NDt9Ci5jb21wLWNo",
  "Z3twYWRkaW5nOjdweCAxNHB4O3RleHQtYWxpZ246cmlnaHQ7d2hpdGUtc3BhY2U6bm93cmFwO30KLmNoZy1hbXR7Zm9udC1mYW1p",
  "bHk6bW9ub3NwYWNlO2ZvbnQtc2l6ZTouODJyZW07Zm9udC13ZWlnaHQ6NzAwO30KLmNoZy1wY3R7Zm9udC1zaXplOi42OHJlbTtv",
  "cGFjaXR5Oi43NTttYXJnaW4tdG9wOjFweDt9Ci5jb21wLXVwIC5jaGctYW10e2NvbG9yOiMxYTVjMjU7fQouY29tcC1kbiAuY2hn",
  "LWFtdHtjb2xvcjojYzQ0O30KLmNvbXAtZmxhdCAuY2hnLWFtdHtjb2xvcjojODg4O30KLmNvbXAtdHJlbmR7dGV4dC1hbGlnbjpj",
  "ZW50ZXI7Zm9udC1zaXplOjEuMXJlbTtmb250LXdlaWdodDo3MDA7cGFkZGluZzo3cHggMTBweDt9Ci50cmVuZC11cHtjb2xvcjoj",
  "MWE1YzI1O30KLnRyZW5kLWRue2NvbG9yOiNjNDQ7fQoudHJlbmQtZmxhdHtjb2xvcjojODg4O30KLmluc2lnaHQtcGFuZWx7YmFj",
  "a2dyb3VuZDp3aGl0ZTtib3JkZXItcmFkaXVzOjEycHg7Ym94LXNoYWRvdzowIDJweCAxMnB4IHJnYmEoMCwwLDAsLjA3KTtvdmVy",
  "ZmxvdzpoaWRkZW47fQouaW5zaWdodC1oZWFkZXJ7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRl",
  "bnQ6c3BhY2UtYmV0d2VlbjtwYWRkaW5nOjE2cHggMjBweDtib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZjBlOGU4O2JhY2tncm91",
  "bmQ6I2ZkZjhmODt9Ci5pbnNpZ2h0LXRpdGxle2ZvbnQtZmFtaWx5OidQbGF5ZmFpciBEaXNwbGF5JyxzZXJpZjtmb250LXNpemU6",
  "MXJlbTtmb250LXdlaWdodDo3MDA7Y29sb3I6IzFhMWExYTt9Ci5pbnNpZ2h0LXN1Yntmb250LXNpemU6Ljc1cmVtO2NvbG9yOiM4",
  "ODg7bWFyZ2luLXRvcDoycHg7fQouYnRuLWluc2lnaHR7YmFja2dyb3VuZDojNkIwRTFFO2NvbG9yOndoaXRlO2JvcmRlcjpub25l",
  "O3BhZGRpbmc6MTBweCAyMHB4O2JvcmRlci1yYWRpdXM6OHB4O2ZvbnQtZmFtaWx5OidTb3VyY2UgU2FucyAzJyxzYW5zLXNlcmlm",
  "O2ZvbnQtc2l6ZTouODVyZW07Zm9udC13ZWlnaHQ6NzAwO2N1cnNvcjpwb2ludGVyO3RyYW5zaXRpb246YmFja2dyb3VuZCAuMTVz",
  "O30KLmJ0bi1pbnNpZ2h0OmhvdmVye2JhY2tncm91bmQ6IzVhMGMxODt9Ci5idG4taW5zaWdodDpkaXNhYmxlZHtvcGFjaXR5Oi42",
  "O2N1cnNvcjpkZWZhdWx0O30KLmluc2lnaHQtbG9hZGluZ3tkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMnB4",
  "O3BhZGRpbmc6MjRweCAyMHB4O2NvbG9yOiM4ODg7Zm9udC1zaXplOi45cmVtO30KLmluc2lnaHQtc3Bpbm5lcnt3aWR0aDoyMHB4",
  "O2hlaWdodDoyMHB4O2JvcmRlcjoycHggc29saWQgI2YwZThlODtib3JkZXItdG9wLWNvbG9yOiM2QjBFMUU7Ym9yZGVyLXJhZGl1",
  "czo1MCU7YW5pbWF0aW9uOnNwaW4gLjhzIGxpbmVhciBpbmZpbml0ZTtmbGV4LXNocmluazowO30KQGtleWZyYW1lcyBzcGlue3Rv",
  "e3RyYW5zZm9ybTpyb3RhdGUoMzYwZGVnKTt9fQouaW5zaWdodC1wcm9tcHR7cGFkZGluZzoyNHB4IDIwcHg7Y29sb3I6I2FhYTtm",
  "b250LXNpemU6Ljg4cmVtO2ZvbnQtc3R5bGU6aXRhbGljO30KLmluc2lnaHQtYm9keXtwYWRkaW5nOjIwcHg7ZGlzcGxheTpmbGV4",
  "O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtnYXA6NnB4O30KLmluc2lnaHQtaGVhZGluZ3tmb250LWZhbWlseTonUGxheWZhaXIgRGlz",
  "cGxheScsc2VyaWY7Zm9udC1zaXplOi45NXJlbTtmb250LXdlaWdodDo3MDA7Y29sb3I6IzZCMEUxRTttYXJnaW4tdG9wOjEwcHg7",
  "cGFkZGluZy1ib3R0b206NHB4O2JvcmRlci1ib3R0b206MXB4IHNvbGlkICNmMGU4ZTg7fQouaW5zaWdodC1saW5le2ZvbnQtc2l6",
  "ZTouODhyZW07Y29sb3I6IzMzMztsaW5lLWhlaWdodDoxLjY7fQouaW5zaWdodC1idWxsZXR7Zm9udC1zaXplOi44OHJlbTtjb2xv",
  "cjojMzMzO2xpbmUtaGVpZ2h0OjEuNjtwYWRkaW5nLWxlZnQ6MTZweDtwb3NpdGlvbjpyZWxhdGl2ZTt9Ci5pbnNpZ2h0LWJ1bGxl",
  "dDo6YmVmb3Jle2NvbnRlbnQ6ImJ1bGxldCI7cG9zaXRpb246YWJzb2x1dGU7bGVmdDo0cHg7Y29sb3I6IzZCMEUxRTtmb250LXNp",
  "emU6LjZyZW07fQouaW5zaWdodC1nYXB7aGVpZ2h0OjZweDt9CgouY2xpZW50LWZvbGRlcntiYWNrZ3JvdW5kOndoaXRlO2JvcmRl",
  "ci1yYWRpdXM6MTBweDtib3JkZXI6MXB4IHNvbGlkICNlOGUwZTA7bWFyZ2luLWJvdHRvbToxMHB4O292ZXJmbG93OmhpZGRlbjti",
  "b3gtc2hhZG93OjAgMXB4IDRweCByZ2JhKDAsMCwwLC4wNSk7fQouY2xpZW50LWZvbGRlci1oZWFkZXJ7ZGlzcGxheTpmbGV4O2Fs",
  "aWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2VlbjtwYWRkaW5nOjE2cHggMjBweDtjdXJzb3I6cG9p",
  "bnRlcjt0cmFuc2l0aW9uOmJhY2tncm91bmQgLjE1cztnYXA6MTJweDt9Ci5jbGllbnQtZm9sZGVyLWhlYWRlcjpob3ZlcntiYWNr",
  "Z3JvdW5kOiNmZGY5Zjk7fQouY2xpZW50LWZvbGRlci1sZWZ0e2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjE0",
  "cHg7ZmxleDoxO30KLmZvbGRlci1pY29ue2ZvbnQtc2l6ZToxLjZyZW07ZmxleC1zaHJpbms6MDt9Ci5jbGllbnQtZm9sZGVyLW5h",
  "bWV7Zm9udC1zaXplOjFyZW07Zm9udC13ZWlnaHQ6NzAwO2NvbG9yOiMxYTFhMWE7fQouY2xpZW50LWZvbGRlci1tZXRhe2ZvbnQt",
  "c2l6ZTouNzhyZW07Y29sb3I6Izg4ODttYXJnaW4tdG9wOjJweDt9Ci5jbGllbnQtZm9sZGVyLXJpZ2h0e2Rpc3BsYXk6ZmxleDth",
  "bGlnbi1pdGVtczpjZW50ZXI7Z2FwOjEwcHg7ZmxleC1zaHJpbms6MDt9Ci5mb2xkZXItY2hldnJvbntmb250LXNpemU6LjdyZW07",
  "Y29sb3I6I2FhYTttYXJnaW4tbGVmdDo0cHg7fQouY2xpZW50LWZvbGRlci1zaGVldHN7YmFja2dyb3VuZDojZjlmNWY1O2JvcmRl",
  "ci10b3A6MXB4IHNvbGlkICNlOGUwZTA7cGFkZGluZzo4cHggMTJweDtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1u",
  "O2dhcDo2cHg7fQouc2hlZXQtY2FyZC1uZXN0ZWR7YmFja2dyb3VuZDp3aGl0ZTtib3JkZXItcmFkaXVzOjhweDttYXJnaW46MDti",
  "b3gtc2hhZG93Om5vbmU7cGFkZGluZzoxMnB4IDE2cHg7fQouc2hlZXQtY2FyZC1uZXN0ZWQ6aG92ZXJ7dHJhbnNmb3JtOm5vbmU7",
  "Ym94LXNoYWRvdzowIDFweCA2cHggcmdiYSgxMDcsMTQsMzAsLjEpO30K",
].join("");
const FBMT_CSS = atob(FBMT_CSS_B64);

const fmt = (v) => v === "" || v === null || v === undefined
  ? "$0"
  : "$" + Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
const numVal = (v) => Number((v || "").toString().replace(/[^0-9.-]/g, "")) || 0;

// ── Commodity Price List ───────────────────────────────────────────────────────
const DEFAULT_COMMODITY_PRICES = [
  // CROPS
  {category:"Crops", name:"Winter Wheat",         price:"5",    unit:"bu"},
  {category:"Crops", name:"Spring Wheat",          price:"5.5",  unit:"bu"},
  {category:"Crops", name:"Durum",                 price:"6",    unit:"bu"},
  {category:"Crops", name:"Barley (Feed)",          price:"3",    unit:"bu"},
  {category:"Crops", name:"Malt Barley",            price:"5.5",  unit:"bu"},
  {category:"Crops", name:"Organic Winter Wheat",   price:"8",    unit:"bu"},
  {category:"Crops", name:"Organic Spring Wheat",   price:"10",   unit:"bu"},
  {category:"Crops", name:"Chickpeas",              price:"18",   unit:"bu"},
  {category:"Crops", name:"Lentils",                price:"16.8", unit:"bu"},
  {category:"Crops", name:"Canola",                 price:"10",   unit:"bu"},
  {category:"Crops", name:"Yellow Peas",            price:"6.5",  unit:"bu"},
  {category:"Crops", name:"Green Peas",             price:"9",    unit:"bu"},
  {category:"Crops", name:"Hay",                    price:"125",  unit:"ton"},
  {category:"Crops", name:"Straw",                  price:"40",   unit:"ton"},
  // LIVESTOCK
  {category:"Livestock", name:"Steers under 600#",  price:"3.6",  unit:"lb"},
  {category:"Livestock", name:"Heifers under 600#", price:"3.4",  unit:"lb"},
  {category:"Livestock", name:"900# Steers",         price:"3",    unit:"lb"},
  {category:"Livestock", name:"800# Steers",         price:"3.1",  unit:"lb"},
  {category:"Livestock", name:"900# Heifers",        price:"2.9",  unit:"lb"},
  {category:"Livestock", name:"800# Heifers",        price:"3",    unit:"lb"},
  {category:"Livestock", name:"Bred Heifers",        price:"3000", unit:"hd"},
  {category:"Livestock", name:"Bred Cows",           price:"2500", unit:"hd"},
  {category:"Livestock", name:"Cull Cows",           price:"1.4",  unit:"lb"},
  {category:"Livestock", name:"Bulls",               price:"1.75", unit:"lb"},
  {category:"Livestock", name:"Lambs - Fats",        price:"1.5",  unit:"lb"},
];

function loadCommodityPrices() {
  try {
    const stored = localStorage.getItem("fbmt_commodityPrices");
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_COMMODITY_PRICES.map((p,i) => ({...p, id:i}));
}
function saveCommodityPrices(prices) {
  try { localStorage.setItem("fbmt_commodityPrices", JSON.stringify(prices)); } catch {}
}

// ── Commodity Typeahead Dropdown ───────────────────────────────────────────────
function CommodityDropdown({ value, onChange, commodityPrices, category, placeholder }) {
  const [open, setOpen] = React.useState(false);
  const [highlight, setHighlight] = React.useState(0);
  const [query, setQuery] = React.useState(value || "");
  const ref = React.useRef(null);

  React.useEffect(() => { setQuery(value || ""); }, [value]);
  React.useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = commodityPrices
    .filter(p => !category || p.category === category)
    .filter(p => p.name && (!query || p.name.toLowerCase().includes(query.toLowerCase())))
    .sort((a,b) => a.name.localeCompare(b.name));

  const select = (item) => { onChange(item.name); setQuery(item.name); setOpen(false); setHighlight(0); };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) { setOpen(true); setHighlight(0); return; }
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight(h => Math.min(h+1, items.length-1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight(h => Math.max(h-1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (items[highlight]) select(items[highlight]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  return (
    <div ref={ref} style={{position:"relative",flex:1}}>
      <input className="text-input" type="text" value={query}
        placeholder={placeholder || "Type or select..."}
        autoComplete="off"
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); setHighlight(0); }}
        onFocus={() => { setOpen(true); setHighlight(0); }}
        onKeyDown={onKeyDown}
        style={{width:"100%",paddingRight:22}} />
      <span style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",
        fontSize:9,color:"#aaa",pointerEvents:"none",lineHeight:1}}>▼</span>
      {open && items.length > 0 && (
        <div style={{position:"absolute",top:"100%",left:0,right:0,background:"white",
          border:"1.5px solid #6B0E1E",borderTop:"none",borderRadius:"0 0 6px 6px",
          zIndex:999,maxHeight:200,overflowY:"auto",boxShadow:"0 4px 12px rgba(0,0,0,.15)"}}>
          {items.map((item,idx) => (
            <div key={item.id} onMouseDown={() => select(item)} onMouseEnter={() => setHighlight(idx)}
              style={{padding:"7px 12px",cursor:"pointer",fontSize:".85rem",
                background:idx===highlight?"#f5e8ea":"white",
                color:idx===highlight?"#6B0E1E":"#1a1a1a",
                fontWeight:idx===highlight?600:400,
                display:"flex",justifyContent:"space-between",alignItems:"center",
                borderBottom:"1px solid #f5f5f5"}}>
              <span>{item.name}</span>
              <span style={{fontSize:".75rem",color:"#888",marginLeft:8}}>${item.price}/{item.unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Expense List ──────────────────────────────────────────────────────────────
const DEFAULT_EXPENSE_LIST = [
  'Seed','Fertilizer','Chemicals / Pesticides','Crop Insurance',
  'Fuel & Oil','Repairs & Maintenance','Custom Hire','Labor - Hired',
  'Land Rent / Cash Rent','Utilities','Trucking & Hauling',
  'Storage & Drying','Interest - Operating','Interest - Term Debt',
  'Accounting & Legal','Supplies','Veterinary & Medicine',
  'Feed - Purchased','Livestock Supplies','Real Estate Taxes',
  'Insurance - Farm','Depreciation','Other',
];

function loadExpenseList() {
  try { const s=localStorage.getItem('fbmt_expenseList'); if(s) return JSON.parse(s); } catch {}
  return DEFAULT_EXPENSE_LIST.map((name,id)=>({id,name}));
}
function saveExpenseList(list) {
  try { localStorage.setItem('fbmt_expenseList',JSON.stringify(list)); } catch {}
}

const STORAGE_PREFIX = "fbmt_bs:";

const STEPS = [
  "intro","cash_glacier","cash_other","receivables","federal_payments",
  "livestock_market","farm_products","crop_investment","supplies","other_current",
  "breeding_stock","real_estate","re_contracts","vehicles","machinery","other_assets",
  "liab_intro","operating_notes","accounts_due","intermediate_debt","re_current",
  "taxes_due","other_current_liab","re_mortgages","other_liabilities","summary"
];
const STEP_LABELS = {
  intro:"Client Info", cash_glacier:"Glacier Bank", cash_other:"Other Banks",
  receivables:"Receivables", federal_payments:"Federal Payments",
  livestock_market:"Market Livestock", farm_products:"Farm Products",
  crop_investment:"Crop Investment", supplies:"Supplies", other_current:"Other Current",
  breeding_stock:"Breeding Stock", real_estate:"Real Estate", re_contracts:"RE Contracts",
  vehicles:"Vehicles", machinery:"Machinery", other_assets:"Other Assets",
  liab_intro:"Liabilities", operating_notes:"Operating Notes", accounts_due:"Accounts Due",
  intermediate_debt:"Term Debt", re_current:"RE Current", taxes_due:"Taxes Due",
  other_current_liab:"Other Curr. Liab", re_mortgages:"RE Mortgages",
  other_liabilities:"Other Liabilities", summary:"Summary"
};
const ASSET_STEPS = ["cash_glacier","cash_other","receivables","federal_payments",
  "livestock_market","farm_products","crop_investment","supplies","other_current",
  "breeding_stock","real_estate","re_contracts","vehicles","machinery","other_assets"];
const LIAB_STEPS = ["operating_notes","accounts_due","intermediate_debt","re_current",
  "taxes_due","other_current_liab","re_mortgages","other_liabilities"];

function emptyData() {
  return {
    clientName:"", asOfDate: new Date().toISOString().slice(0,10),
    cashGlacier:"", cashOther:[{institution:"",amount:""}],
    receivables:[{description:"",amount:""}], receivablesSecured:"",
    federalPayments:[{program:"",amount:""}],
    livestockMarket:[{number:"",kind:"",value:""}],
    farmProducts:[{quantity:"",kind:"",pricePerUnit:"",unit:"bu",share:"100",contracted:false}],
    cropInvestment:[{cropType:"",acres:"",valuePerAcre:""}],
    supplies:[{description:"",value:""}], otherCurrent:[{description:"",amount:""}],
    breedingStock:[{number:"",kind:"",value:""}],
    realEstate:[{acres:"",reType:"",description:"",valuePerAcre:""}],
    reContracts:[{description:"",amount:""}],
    vehicles:[{year:"",make:"",vin:"",condition:"",value:""}],
    machinery:[{year:"",make:"",size:"",serial:"",condition:"",value:""}],
    otherAssets:[{description:"",amount:""}],
    operatingNotes:[{creditor:"",dueDate:"",pmt:"",balance:"",security:""}],
    accountsDue:[{creditor:"",amount:""}],
    intermediatDebt:[{creditor:"",security:"",dueDate:"",annualPmt:"",principal:"",rate:""}],
    reCurrent:[{creditor:"",annualPmt:"",rate:""}],
    taxesDue:"", otherCurrentLiab:[{description:"",amount:""}],
    reMortgages:[{lienHolder:"",terms:"",principal:"",rate:""}],
    otherLiabilities:[{description:"",balance:""}],
    budgetCrops:[{acres:"",crop:"",yieldPerAcre:"",unit:"bu",price:"",share:"100",contracted:false}],
    budgetLivestock:[{head:"",type:"",lbs:"",price:""}],
    budgetMisc:[{description:"Government Payments (FSA/ARC/PLC)",amount:""}],
    budgetExpenses:[{description:"",amount:""}],
    inspDate: new Date().toISOString().split('T')[0],
    inspInspector:"", inspLoans:["","",""],
    inspCrops:[], inspLivestock:[], inspInventory:[],
    inspCropCmt:"", inspLsCmt:"", inspInvCmt:"",
    inspPastureCond:"", inspPastureCmt:"",
    inspWaterCond:"", inspWaterCmt:"",
    inspEquipCond:"", inspEquipCmt:"",
    inspEnvCmt:"", inspAddlCmt:"",
    inspPhotos:[],
    inspMode: 'pre',
    postStorage:[],
    postPastureCond:"", postPastureCmt:"",
    postWaterCond:"", postWaterCmt:"",
    postEquipCond:"", postEquipCmt:"",
    postEnvCmt:"", postAddlCmt:"",
    postPhotos:[],
  };
}

// Tiny reusable components
function Inp({ label, value, onChange, placeholder, prefix }) {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}
      <div className="input-wrap">
        {prefix && <span className="prefix">{prefix}</span>}
        <input type="text" value={value} placeholder={placeholder || "0"}
          onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ""))} />
      </div>
    </div>
  );
}
function TxtInp({ label, value, onChange, placeholder }) {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}
      <input className="text-input" type="text" value={value}
        placeholder={placeholder || ""} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
function SecHdr({ icon, title, subtitle, color }) {
  return (
    <div className="section-header" style={{ borderColor: color || "#6B0E1E" }}>
      <div className="section-icon">{icon}</div>
      <div>
        <h2>{title}</h2>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}
function CalcRow({ label, value, style }) {
  return (
    <div className="fp-calc-total" style={style}>
      <span className="fp-equals">=</span>
      <span className="fp-result">{value > 0 ? fmt(value) : "—"}</span>
    </div>
  );
}
function RunningTotal({ assets, liabilities }) {
  const nw = assets - liabilities;
  return (
    <div className="running-total">
      <div className="rt-item"><span>Total Assets</span><strong className="green">{fmt(assets)}</strong></div>
      <div className="rt-item"><span>Total Liabilities</span><strong className="red">{fmt(liabilities)}</strong></div>
      <div className="rt-item net"><span>Net Worth</span>
        <strong className={nw >= 0 ? "green" : "red"}>{fmt(nw)}</strong>
      </div>
    </div>
  );
}


// ─── BudgetView ───────────────────────────────────────────────────────────────
function BudgetView({
  data, budgetCropTotal, budgetLivestockTotal, budgetMiscTotal,
  budgetTotalIncome, budgetOperatingExpenses,
  debtServiceTerms, debtServiceRE,
  debtServiceTermsPersonal, debtServiceTermsCorp,
  debtServiceREPersonal, debtServiceRECorp,
  budgetTotalDebtService, budgetPersonalDebtTotal, budgetCorpDebtTotal,
  corpPersonalDebt, corpPersonalDebtTotal,
  budgetTotalExpenses, budgetNetIncome,
  setArr, removeRow, addRow, lookupPrice, commodityPrices
}) {
  return (
    <div className="budget-wrap">
      <div className="budget-section">
        <div className="budget-section-head income-head">
          <span>INCOME</span>
          <span className="bsh-total">{fmt(budgetTotalIncome)}</span>
        </div>
        <div className="budget-subsection">
          <div className="budget-sub-label">Crop Income</div>
          <div className="bg-header-row">
            <span style={{width:20}}></span>
            <span className="bg-col-label" style={{width:75}}>Acres</span>
            <span className="bg-col-label" style={{flex:1}}>Crop</span>
            <span className="bg-col-label" style={{width:90}}>Yield/Acre</span>
            <span className="bg-col-label" style={{width:65}}>Unit</span>
            <span className="bg-col-label" style={{width:100}}>Price</span>
            <span className="bg-col-label" style={{width:70}}>Share %</span>
            <span className="bg-col-label" style={{width:85,textAlign:"center"}}>Contracted</span>
            <span className="bg-col-label" style={{width:115}}>Your Value</span>
            <span style={{width:32}}></span>
          </div>
          {data.budgetCrops.map((r, i) => {
            const share = numVal(r.share || "100");
            const defaultPrice = !r.contracted ? lookupPrice(r.crop) : null;
            const effectivePrice = r.contracted ? r.price : (defaultPrice || r.price);
            const rv = numVal(r.acres) * numVal(r.yieldPerAcre) * numVal(effectivePrice) * (share / 100);
            return (
              <div key={i} className="bg-row" data-rowkey={`budgetCrops-${i}`}>
                <span className="row-num">{i+1}</span>
                <div className="input-group" style={{width:75,flexShrink:0}}>
                  <div className="input-wrap">
                    <input type="text" value={r.acres} placeholder="0"
                      onChange={e => setArr("budgetCrops",i,"acres",e.target.value.replace(/[^0-9.]/g,""))} />
                  </div>
                </div>
                <div className="input-group" style={{flex:1,position:"relative"}}>
                  <CommodityDropdown
                    value={r.crop}
                    onChange={v => setArr("budgetCrops",i,"crop",v)}
                    commodityPrices={commodityPrices}
                    category="Crops"
                    placeholder="Type or select crop..."
                  />
                </div>
                <div className="input-group" style={{width:90,flexShrink:0}}>
                  <div className="input-wrap">
                    <input type="text" value={r.yieldPerAcre} placeholder="0"
                      onChange={e => setArr("budgetCrops",i,"yieldPerAcre",e.target.value.replace(/[^0-9.]/g,""))} />
                  </div>
                </div>
                <div className="input-group" style={{width:65,flexShrink:0}}>
                  <select className="unit-select" value={r.unit}
                    onChange={e => setArr("budgetCrops",i,"unit",e.target.value)}>
                    <option>bu</option><option>lbs</option>
                    <option>ton</option><option>cwt</option><option>bale</option>
                  </select>
                </div>
                {/* Contracted checkbox BEFORE price */}
                <div style={{width:90,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                  <input type="checkbox" id={"bc-con-"+i} checked={!!r.contracted}
                    onChange={e => setArr("budgetCrops",i,"contracted",e.target.checked)}
                    style={{width:15,height:15,accentColor:"#6B0E1E",cursor:"pointer"}} />
                  <label htmlFor={"bc-con-"+i} style={{fontSize:".72rem",color:"#6B0E1E",cursor:"pointer",fontWeight:r.contracted?700:400}}>
                    {r.contracted ? "Contracted" : "Contract?"}
                  </label>
                </div>
                {/* Price — locked to commodity list unless contracted */}
                <div className="input-group" style={{width:105,flexShrink:0}}>
                  <div className="input-wrap" title={!r.contracted&&defaultPrice ? "Price from commodity list. Check 'Contracted' to override." : ""}>
                    <span className="prefix">$</span>
                    {r.contracted ? (
                      <input type="text" value={r.price} placeholder="0.00"
                        onChange={e => setArr("budgetCrops",i,"price",e.target.value.replace(/[^0-9.]/g,""))} />
                    ) : (
                      <input type="text" value={defaultPrice || r.price} placeholder="0.00"
                        readOnly={!!defaultPrice}
                        style={{background:defaultPrice?"#f5f5f5":undefined,color:defaultPrice?"#555":undefined,cursor:defaultPrice?"not-allowed":"text"}}
                        onChange={e => !defaultPrice && setArr("budgetCrops",i,"price",e.target.value.replace(/[^0-9.]/g,""))} />
                    )}
                  </div>
                  {!r.contracted && defaultPrice && (
                    <div style={{fontSize:".65rem",color:"#888",textAlign:"center",marginTop:1}}>list price</div>
                  )}
                </div>
                <div className="input-group" style={{width:70,flexShrink:0}}>
                  <div className="input-wrap">
                    <input type="text" value={r.share ?? "100"} placeholder="100"
                      onChange={e => setArr("budgetCrops",i,"share",e.target.value.replace(/[^0-9.]/g,""))} />
                    <span className="prefix" style={{borderLeft:"1.5px solid #ddd",borderRight:"none"}}>%</span>
                  </div>
                </div>
                <CalcRow value={rv} style={{width:115}} />
                <button className="remove-btn" onClick={() => removeRow("budgetCrops",i)}>x</button>
              </div>
            );
          })}
          <button className="add-btn"
            onClick={() => addRow("budgetCrops",{acres:"",crop:"",yieldPerAcre:"",unit:"bu",price:"",share:"100",contracted:false})}>
            + Add Crop
          </button>
          <div className="budget-subtotal">
            <span>Crop Income Subtotal</span><strong>{fmt(budgetCropTotal)}</strong>
          </div>
        </div>
        <div className="budget-subsection">
          <div className="budget-sub-label">Livestock Income</div>
          <div className="bg-header-row">
            <span style={{width:20}}></span>
            <span className="bg-col-label" style={{width:80}}># Head</span>
            <span className="bg-col-label" style={{flex:1}}>Type / Variety</span>
            <span className="bg-col-label" style={{width:90}}>Lbs/Head</span>
            <span className="bg-col-label" style={{width:110}}>Price / Lb</span>
            <span className="bg-col-label" style={{width:115}}>Value</span>
            <span style={{width:32}}></span>
          </div>
          {data.budgetLivestock.map((r, i) => {
            const defaultPrice = lookupPrice(r.type);
            const effectivePrice = defaultPrice || r.price;
            const rv = numVal(r.head) * numVal(r.lbs) * numVal(effectivePrice);
            return (
              <div key={i} className="bg-row" data-rowkey={`budgetLivestock-${i}`}>
                <span className="row-num">{i+1}</span>
                <div className="input-group" style={{width:80,flexShrink:0}}>
                  <div className="input-wrap">
                    <input type="text" value={r.head} placeholder="0"
                      onChange={e => setArr("budgetLivestock",i,"head",e.target.value.replace(/[^0-9.]/g,""))} />
                  </div>
                </div>
                <div className="input-group" style={{flex:1}}>
                  <input className="text-input" type="text" value={r.type}
                    placeholder="e.g., 800 lb steers"
                    onChange={e => setArr("budgetLivestock",i,"type",e.target.value)} />
                </div>
                <div className="input-group" style={{width:90,flexShrink:0}}>
                  <div className="input-wrap">
                    <input type="text" value={r.lbs} placeholder="0"
                      onChange={e => setArr("budgetLivestock",i,"lbs",e.target.value.replace(/[^0-9.]/g,""))} />
                  </div>
                </div>
                <div className="input-group" style={{width:110,flexShrink:0}}>
                  <div className="input-wrap" title={defaultPrice ? "Price from commodity list" : ""}>
                    <span className="prefix">$</span>
                    <input type="text" value={effectivePrice} placeholder="0.00"
                      readOnly={!!defaultPrice}
                      style={{background:defaultPrice?"#f5f5f5":undefined,color:defaultPrice?"#555":undefined,cursor:defaultPrice?"not-allowed":"text"}}
                      onChange={e => !defaultPrice && setArr("budgetLivestock",i,"price",e.target.value.replace(/[^0-9.]/g,""))} />
                  </div>
                  {defaultPrice && <div style={{fontSize:".65rem",color:"#888",textAlign:"center",marginTop:1}}>list price</div>}
                </div>
                <CalcRow value={rv} style={{width:115}} />
                <button className="remove-btn" onClick={() => removeRow("budgetLivestock",i)}>x</button>
              </div>
            );
          })}
          <button className="add-btn"
            onClick={() => addRow("budgetLivestock",{head:"",type:"",lbs:"",price:""})}>
            + Add Livestock
          </button>
          <div className="budget-subtotal">
            <span>Livestock Income Subtotal</span><strong>{fmt(budgetLivestockTotal)}</strong>
          </div>
        </div>
        <div className="budget-subsection">
          <div className="budget-sub-label">Miscellaneous Income</div>
          {data.budgetMisc.map((r, i) => (
            <div key={i} className="bg-row" data-rowkey={`budgetMisc-${i}`}>
              <span className="row-num">{i+1}</span>
              <div className="input-group" style={{flex:1}}>
                <input className="text-input" type="text" value={r.description}
                  placeholder="e.g., Government Payments, CRP"
                  onChange={e => setArr("budgetMisc",i,"description",e.target.value)} />
              </div>
              <div className="input-group" style={{width:150,flexShrink:0}}>
                <div className="input-wrap">
                  <span className="prefix">$</span>
                  <input type="text" value={r.amount} placeholder="0"
                    onChange={e => setArr("budgetMisc",i,"amount",e.target.value.replace(/[^0-9.]/g,""))} />
                </div>
              </div>
              <button className="remove-btn" onClick={() => removeRow("budgetMisc",i)}>x</button>
            </div>
          ))}
          <button className="add-btn"
            onClick={() => addRow("budgetMisc",{description:"",amount:""})}>
            + Add Misc Income
          </button>
          <div className="budget-subtotal">
            <span>Misc Income Subtotal</span>
            <strong>{fmt(budgetMiscTotal)}</strong>
          </div>
        </div>
        <div className="budget-grand income-grand">
          <span>TOTAL INCOME</span><span>{fmt(budgetTotalIncome)}</span>
        </div>
      </div>

      <div className="budget-section">
        <div className="budget-section-head expense-head">
          <span>EXPENSES</span>
          <span className="bsh-total">{fmt(budgetTotalExpenses + (corpPersonalDebtTotal||0))}</span>
        </div>
        <div className="budget-subsection">
          <div className="budget-sub-label">Operating Expenses</div>
          {data.budgetExpenses.map((r, i) => (
            <div key={i} className="bg-row" data-rowkey={`budgetExpenses-${i}`}>
              <span className="row-num">{i+1}</span>
              <div className="input-group" style={{flex:1}}>
                <input className="text-input" type="text" value={r.description}
                  placeholder="e.g., Seed, Fertilizer, Fuel, Labor"
                  onChange={e => setArr("budgetExpenses",i,"description",e.target.value)} />
              </div>
              <div className="input-group" style={{width:150,flexShrink:0}}>
                <div className="input-wrap">
                  <span className="prefix">$</span>
                  <input type="text" value={r.amount} placeholder="0"
                    onChange={e => setArr("budgetExpenses",i,"amount",e.target.value.replace(/[^0-9.]/g,""))} />
                </div>
              </div>
              <button className="remove-btn" onClick={() => removeRow("budgetExpenses",i)}>x</button>
            </div>
          ))}
          <button className="add-btn"
            onClick={() => addRow("budgetExpenses",{description:"",amount:""})}>
            + Add Expense
          </button>
          <div className="budget-subtotal">
            <span>Total Operating Expenses</span>
            <strong>{fmt(budgetOperatingExpenses)}</strong>
          </div>
        </div>
        <div className="budget-subsection">
          <div className="budget-sub-label">
            Debt Service
            <span style={{fontSize:".65rem",color:"#aaa",fontWeight:400,marginLeft:8}}>
              auto-filled from balance sheet
            </span>
          </div>
          {debtServiceTerms.length === 0 && debtServiceRE.length === 0 && (
            <div className="debt-empty">No debt entered on Balance Sheet tab yet.</div>
          )}
          {debtServiceTermsPersonal.length > 0 && (
            <div>
              <div className="debt-category-label">Intermediate / Term Debt — Personal</div>
              {debtServiceTermsPersonal.map((r, i) => (
                <div key={i} className="debt-row">
                  <span className="debt-creditor">{r.creditor}</span>
                  <span className="debt-detail">{r.security ? "(" + r.security + ")" : ""}</span>
                  <span className="debt-amount">{fmt(r.annualPmt)}</span>
                </div>
              ))}
            </div>
          )}
          {debtServiceTermsCorp.length > 0 && (
            <div>
              <div className="debt-category-label" style={{color:"#2d5a8e"}}>
                Intermediate / Term Debt — Corp Paid
              </div>
              {debtServiceTermsCorp.map((r, i) => (
                <div key={i} className="debt-row" style={{borderLeftColor:"#2d5a8e"}}>
                  <span className="debt-creditor">{r.creditor}</span>
                  <span className="debt-detail" style={{color:"#2d5a8e",fontSize:".7rem"}}>corp pays</span>
                  <span className="debt-amount" style={{color:"#2d5a8e"}}>{fmt(r.annualPmt)}</span>
                </div>
              ))}
            </div>
          )}
          {debtServiceREPersonal.length > 0 && (
            <div>
              <div className="debt-category-label">Real Estate Mortgages — Personal</div>
              {debtServiceREPersonal.map((r, i) => (
                <div key={i} className="debt-row">
                  <span className="debt-creditor">{r.creditor}</span>
                  <span className="debt-detail"></span>
                  <span className="debt-amount">{fmt(r.annualPmt)}</span>
                </div>
              ))}
            </div>
          )}
          {debtServiceRECorp.length > 0 && (
            <div>
              <div className="debt-category-label" style={{color:"#2d5a8e"}}>
                Real Estate Mortgages — Corp Paid
              </div>
              {debtServiceRECorp.map((r, i) => (
                <div key={i} className="debt-row" style={{borderLeftColor:"#2d5a8e"}}>
                  <span className="debt-creditor">{r.creditor}</span>
                  <span className="debt-detail" style={{color:"#2d5a8e",fontSize:".7rem"}}>corp pays</span>
                  <span className="debt-amount" style={{color:"#2d5a8e"}}>{fmt(r.annualPmt)}</span>
                </div>
              ))}
            </div>
          )}
          {budgetCorpDebtTotal > 0 && (
            <div style={{display:"flex",justifyContent:"space-between",padding:"5px 8px",fontSize:".8rem",color:"#2d5a8e",background:"#f0f6ff",borderRadius:5,marginTop:4}}>
              <span>Corp Paid Subtotal</span><strong>{fmt(budgetCorpDebtTotal)}</strong>
            </div>
          )}
          {corpPersonalDebt && corpPersonalDebt.length > 0 && (
            <div style={{marginTop:8}}>
              <div className="debt-category-label" style={{color:"#7a4f00",background:"#fff8e8",padding:"3px 6px",borderRadius:4}}>
                Personal Debt Paid by This Entity
              </div>
              {corpPersonalDebt.filter(r=>r.annualPmt && numVal(r.annualPmt)>0).map((r, i) => (
                <div key={i} className="debt-row" style={{borderLeftColor:"#c08020"}}>
                  <span className="debt-creditor">{r.creditor}</span>
                  <span className="debt-detail" style={{color:"#7a4f00",fontSize:".7rem"}}>
                    {r.owner}{r.security ? " · " + r.security : ""}
                  </span>
                  <span className="debt-amount" style={{color:"#7a4f00"}}>{fmt(r.annualPmt)}</span>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",padding:"5px 8px",fontSize:".8rem",color:"#7a4f00",background:"#fff8e8",borderRadius:5,marginTop:4}}>
                <span>Personal Debt Subtotal</span>
                <strong>{fmt(corpPersonalDebt.filter(r=>r.annualPmt&&numVal(r.annualPmt)>0).reduce((s,r)=>s+numVal(r.annualPmt),0))}</strong>
              </div>
            </div>
          )}
          <div className="budget-subtotal">
            <span>Total Debt Service{budgetCorpDebtTotal > 0 ? " (personal + corp)" : ""}</span>
            <strong>{fmt(budgetTotalDebtService)}</strong>
          </div>
        </div>
        <div className="budget-grand expense-grand">
          <span>TOTAL EXPENSES</span>
          <span>{fmt(budgetTotalExpenses + (corpPersonalDebtTotal||0))}</span>
        </div>
        <div className={"budget-net " + ((budgetTotalIncome - budgetTotalExpenses - (corpPersonalDebtTotal||0)) >= 0 ? "net-positive" : "net-negative")}>
          <div className="margin-detail">
            <div className="margin-label">
              {(budgetTotalIncome - budgetTotalExpenses - (corpPersonalDebtTotal||0)) >= 0 ? "MARGIN (Net Income)" : "MARGIN (Net Loss)"}
            </div>
            <div className="margin-calc">
              {fmt(budgetTotalIncome)} income minus {fmt(budgetTotalExpenses + (corpPersonalDebtTotal||0))} expenses
            </div>
          </div>
          <span className="margin-value">{fmt(Math.abs(budgetTotalIncome - budgetTotalExpenses - (corpPersonalDebtTotal||0)))}</span>
        </div>
      </div>
    </div>
  );
}

// ─── ComparisonView ───────────────────────────────────────────────────────────
function ComparisonView({
  compSheets, compLoading, compInsight, compInsightLoading,
  generateInsights, clientName, SECTION_BREAKS, SECTION_HEADERS, BOLD_ROWS
}) {
  if (compLoading) return <div className="comp-loading">Loading saved sheets...</div>;
  if (compSheets.length === 0) return (
    <div className="comp-empty">
      <p>No saved balance sheets found for <strong>{clientName}</strong>.</p>
      <p>Complete and save multiple years to enable comparison.</p>
    </div>
  );
  if (compSheets.length === 1) return (
    <div className="comp-empty">
      <p>Only one sheet saved ({compSheets[0].date}). Save a second year to compare.</p>
    </div>
  );
  const labels = Object.keys(compSheets[0].totals);
  const years = compSheets.map(s => s.date);
  const colSpan = years.length + (years.length - 1) + (years.length > 2 ? 1 : 0) + 1;

  return (
    <div className="comp-wrap">
      <div className="comp-table-wrap">
        <table className="comp-table">
          <thead>
            <tr>
              <th className="comp-th comp-label-th">Category</th>
              {years.map((y,i) => <th key={i} className="comp-th comp-year-th">{y}</th>)}
              {years.slice(1).map((y,i) => (
                <th key={i} className="comp-th comp-chg-th">
                  Change {years[i]} to {y}
                </th>
              ))}
              {years.length > 2 && <th className="comp-th comp-trend-th">Trend</th>}
            </tr>
          </thead>
          <tbody>
            {labels.map((label) => {
              const isBold = BOLD_ROWS.has(label);
              const isBreak = SECTION_BREAKS.has(label);
              const sectionHead = SECTION_HEADERS[label];
              const vals = compSheets.map(s => s.totals[label] || 0);
              const first = vals[0];
              const last = vals[vals.length - 1];
              const trendArrow = last > first ? "up" : last < first ? "down" : "flat";
              const trendSym = last > first ? "↑" : last < first ? "↓" : "→";
              const rowCls = "comp-row" + (isBold ? " comp-bold-row" : "") + (isBreak ? " comp-break-row" : "");
              return (
                <React.Fragment key={label}>
                  {sectionHead && (
                    <tr className="comp-section-head">
                      <td colSpan={colSpan}>{sectionHead}</td>
                    </tr>
                  )}
                  <tr className={rowCls}>
                    <td className="comp-label">{label}</td>
                    {vals.map((v,i) => {
                      const valCls = "comp-val" + (isBold ? " comp-bold-val" : "");
                      return (
                        <td key={i} className={valCls}>
                          {v === 0 && !isBold
                            ? <span className="comp-zero">—</span>
                            : <span className={v < 0 ? "comp-neg" : ""}>
                                {v < 0 ? "-$" + Math.abs(v).toLocaleString() : "$" + v.toLocaleString()}
                              </span>
                          }
                        </td>
                      );
                    })}
                    {vals.slice(1).map((v, i) => {
                      const prev = vals[i];
                      const diff = v - prev;
                      const pct = prev !== 0 ? (diff / Math.abs(prev) * 100) : null;
                      if (diff === 0 && prev === 0) {
                        return <td key={i} className="comp-chg"><span className="comp-zero">—</span></td>;
                      }
                      const chgCls = "comp-chg " + (diff > 0 ? "comp-up" : diff < 0 ? "comp-dn" : "comp-flat");
                      const diffStr = diff < 0
                        ? "-$" + Math.abs(diff).toLocaleString()
                        : "+$" + diff.toLocaleString();
                      return (
                        <td key={i} className={chgCls}>
                          <div className="chg-amt">{diffStr}</div>
                          {pct !== null && (
                            <div className="chg-pct">{pct >= 0 ? "+" : ""}{pct.toFixed(1)}%</div>
                          )}
                        </td>
                      );
                    })}
                    {years.length > 2 && (
                      <td className={"comp-trend trend-" + trendArrow}>{trendSym}</td>
                    )}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="insight-panel">
        <div className="insight-header">
          <div>
            <div className="insight-title">AI Financial Insights</div>
            <div className="insight-sub">
              Claude analyzes year-over-year changes and explains what they mean
            </div>
          </div>
          <button className="btn-insight" onClick={generateInsights}
            disabled={compInsightLoading}>
            {compInsightLoading ? "Analyzing..." : compInsight ? "Re-analyze" : "Generate Insights"}
          </button>
        </div>
        {compInsightLoading && (
          <div className="insight-loading">
            <div className="insight-spinner"></div>
            <span>Analyzing {years.length} years of data...</span>
          </div>
        )}
        {compInsight && !compInsightLoading && (
          <div className="insight-body">
            {compInsight.split("\n").map((line, i) => {
              const t = line.trim();
              if (!t) return <div key={i} className="insight-gap" />;
              if (t.startsWith("##") || (t.startsWith("**") && t.endsWith("**"))) {
                return <div key={i} className="insight-heading">
                  {t.replace(/\*\*/g,"").replace(/##/g,"").trim()}
                </div>;
              }
              if (t.startsWith("- ") || t.startsWith("• ")) {
                return <div key={i} className="insight-bullet">{t.slice(2)}</div>;
              }
              return <div key={i} className="insight-line">{line}</div>;
            })}
          </div>
        )}
        {!compInsight && !compInsightLoading && (
          <div className="insight-prompt">
            Click Generate Insights for an AI-powered analysis of the financial changes.
          </div>
        )}
      </div>
    </div>
  );
}


// ── Ag Inspection Tab ────────────────────────────────────────────────────────
const INSP_CONDITIONS=["Excellent","Good","Fair","Poor"],INSP_WATER_COND=["Excess","Adequate","Limited"];
const inspUid=()=>Math.random().toString(36).slice(2,9);
const ISH='#1B4332',ITH='#2D6A4F',IGOLD='#C8860A';
const iCS=c=>({Excellent:{color:'#15803d',bg:'#dcfce7',border:'#86efac'},Good:{color:'#1d4ed8',bg:'#dbeafe',border:'#93c5fd'},Fair:{color:'#92400e',bg:'#fef3c7',border:'#fcd34d'},Poor:{color:'#991b1b',bg:'#fee2e2',border:'#fca5a5'},Excess:{color:'#1d4ed8',bg:'#dbeafe',border:'#93c5fd'},Adequate:{color:'#15803d',bg:'#dcfce7',border:'#86efac'},Limited:{color:'#991b1b',bg:'#fee2e2',border:'#fca5a5'}}[c]||{color:'#6b7280',bg:'#f3f4f6',border:'#d1d5db'});
const iFmt$=v=>{const n=parseFloat(v)||0;return n===0?'—':`$${n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;};
const devPct=(a,b)=>{const av=parseFloat(a)||0,bv=parseFloat(b)||0;if(!bv)return null;return((av-bv)/bv)*100;};
const devStyle=p=>{if(p===null)return{};const abs=Math.abs(p);if(abs>=20)return{background:'#fef2f2',borderLeft:'4px solid #dc2626'};if(abs>=5)return{background:'#fffbeb',borderLeft:'4px solid #f59e0b'};return{};};
const devBadge=p=>{if(p===null||Math.abs(p)<0.5)return null;const abs=Math.abs(p),pos=p>0,color=abs>=20?'#dc2626':abs>=5?'#d97706':'#16a34a';return React.createElement('span',{style:{fontSize:10,fontWeight:700,color,background:color+'18',padding:'1px 6px',borderRadius:999,whiteSpace:'nowrap'}},(pos?'+':'')+p.toFixed(1)+'%');};
const ILBL={fontSize:12,fontWeight:600,color:'#374151',marginBottom:4,display:'block',letterSpacing:.3};
const ITHS={background:ITH,color:'white',padding:'6px 8px',fontSize:11,fontWeight:700,textAlign:'center',whiteSpace:'nowrap'};
const ITDS={padding:'4px 6px',borderBottom:'1px solid #f0fdf4',verticalAlign:'middle'};
function ICP({value,onChange,options=INSP_CONDITIONS}){return React.createElement('div',{style:{display:'flex',gap:3,flexWrap:'wrap'}},options.map(o=>{const cs=iCS(o),active=value===o;return React.createElement('button',{key:o,type:'button',onClick:()=>onChange(active?'':o),style:{padding:'2px 9px',borderRadius:999,fontSize:11,fontWeight:700,cursor:'pointer',transition:'all .15s',border:`1.5px solid ${active?cs.border:'#e5e7eb'}`,background:active?cs.bg:'white',color:active?cs.color:'#9ca3af',lineHeight:1.6}},o);}));}
function ICard({title,children}){return React.createElement('div',{style:{marginBottom:20,borderRadius:6,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.1)',border:'1px solid #d1fae5'}},React.createElement('div',{style:{background:ISH,padding:'9px 16px'}},React.createElement('span',{style:{color:'white',fontWeight:700,fontSize:15}},title)),React.createElement('div',{style:{background:'white',padding:16}},children));}
const iInp=(val,onChange,ph='',type='text',extra={})=>React.createElement('input',{type,value:val,placeholder:ph,onChange:e=>onChange(e.target.value),style:{border:'1px solid #d1d5db',borderRadius:4,padding:'4px 7px',fontSize:13,width:'100%',fontFamily:'inherit',outline:'none',boxSizing:'border-box',background:'white',...extra}});
const iTa=(val,onChange,ph,rows=3)=>React.createElement('textarea',{value:val,onChange:e=>onChange(e.target.value),placeholder:ph,rows,style:{border:'1px solid #d1d5db',borderRadius:4,padding:'6px 8px',fontSize:13,width:'100%',fontFamily:'inherit',outline:'none',resize:'vertical',boxSizing:'border-box'}});

function InspectionView({data,setData}){
  const fileRef=React.useRef(null),camRef=React.useRef(null),printRef=React.useRef(null);
  const [submitting,setSubmitting]=React.useState(false),[submitted,setSubmitted]=React.useState(false),[submitErr,setSubmitErr]=React.useState('');
  const [showShareModal,setShowShareModal]=React.useState(false),[shareLink,setShareLink]=React.useState(''),[sharePin,setSharePin]=React.useState(''),[shareStatus,setShareStatus]=React.useState(''),[checkingResponse,setCheckingResponse]=React.useState(false),[customerResponse,setCustomerResponse]=React.useState(null);
  const [showShareInsp,setShowShareInsp]=React.useState(false),[shareInspEmail,setShareInspEmail]=React.useState(''),[shareInspSending,setShareInspSending]=React.useState(false),[shareInspSent,setShareInspSent]=React.useState(false),[shareInspErr,setShareInspErr]=React.useState('');
  React.useEffect(()=>{
    if(!data.inspCrops||data.inspCrops.length===0){
      const rows=(data.budgetCrops||[]).filter(r=>r.crop||r.acres).map(r=>({id:inspUid(),budgetedCrop:r.crop||'',budgetedAcres:r.acres||'',budgetedYield:r.yieldPerAcre||'',budgetedUnit:r.unit||'bu',budgetedPrice:r.price||'',location:'',condition:'',actualAcres:'',actualYield:'',valuePerUnit:'',deviationReason:'',substituted:false,substituteCrop:''}));
      setData(d=>({...d,inspCrops:rows.length>0?rows:[{id:inspUid(),budgetedCrop:'',budgetedAcres:'',budgetedYield:'',budgetedUnit:'bu',budgetedPrice:'',location:'',condition:'',actualAcres:'',actualYield:'',valuePerUnit:'',deviationReason:'',substituted:false,substituteCrop:''}]}));
    }
    if(!data.inspLivestock||data.inspLivestock.length===0){
      const rows=(data.budgetLivestock||[]).filter(r=>r.type||r.head).map(r=>({id:inspUid(),budgetedType:r.type||'',budgetedHead:r.head||'',budgetedLbs:r.lbs||'',budgetedPrice:r.price||'',location:'',condition:'',actualHead:'',estWeight:'',valuePerUnit:'',deviationReason:''}));
      setData(d=>({...d,inspLivestock:rows.length>0?rows:[{id:inspUid(),budgetedType:'',budgetedHead:'',budgetedLbs:'',budgetedPrice:'',location:'',condition:'',actualHead:'',estWeight:'',valuePerUnit:'',deviationReason:''}]}));
    }
    if(!data.inspInventory||data.inspInventory.length===0){setData(d=>({...d,inspInventory:[{id:inspUid(),description:'',location:'',condition:'',quantity:'',unitType:'bu',valuePerUnit:''}]}));}
  },[]);
  const iset=(f,v)=>setData(d=>({...d,[f]:v}));
  const setLoan=(i,v)=>setData(d=>({...d,inspLoans:d.inspLoans.map((x,j)=>j===i?v:x)}));
  const uC=(id,f,v)=>setData(d=>({...d,inspCrops:d.inspCrops.map(r=>r.id===id?{...r,[f]:v}:r)}));
  const uL=(id,f,v)=>setData(d=>({...d,inspLivestock:d.inspLivestock.map(r=>r.id===id?{...r,[f]:v}:r)}));
  const uI=(id,f,v)=>setData(d=>({...d,inspInventory:d.inspInventory.map(r=>r.id===id?{...r,[f]:v}:r)}));
  const aC=()=>setData(d=>({...d,inspCrops:[...d.inspCrops,{id:inspUid(),budgetedCrop:'',budgetedAcres:'',budgetedYield:'',budgetedUnit:'bu',budgetedPrice:'',location:'',condition:'',actualAcres:'',actualYield:'',valuePerUnit:'',deviationReason:'',substituted:false,substituteCrop:''}]}));
  const aL=()=>setData(d=>({...d,inspLivestock:[...d.inspLivestock,{id:inspUid(),budgetedType:'',budgetedHead:'',budgetedLbs:'',budgetedPrice:'',location:'',condition:'',actualHead:'',estWeight:'',valuePerUnit:'',deviationReason:''}]}));
  const aI=()=>setData(d=>({...d,inspInventory:[...d.inspInventory,{id:inspUid(),description:'',location:'',condition:'',quantity:'',unitType:'bu',valuePerUnit:''}]}));
  const rC=id=>setData(d=>({...d,inspCrops:d.inspCrops.filter(r=>r.id!==id)}));
  const rL=id=>setData(d=>({...d,inspLivestock:d.inspLivestock.filter(r=>r.id!==id)}));
  const rI=id=>setData(d=>({...d,inspInventory:d.inspInventory.filter(r=>r.id!==id)}));
  const handleFiles=e=>{Array.from(e.target.files).forEach(f=>{const r=new FileReader();r.onload=ev=>setData(d=>({...d,inspPhotos:[...(d.inspPhotos||[]),{id:inspUid(),src:ev.target.result,label:'',ts:new Date().toLocaleString()}]}));r.readAsDataURL(f);});e.target.value='';};
  const cRT=r=>(parseFloat(r.actualAcres||0))*(parseFloat(r.actualYield||r.budgetedYield||0))*(parseFloat(r.valuePerUnit||r.budgetedPrice||0));
  const lRT=r=>(parseFloat(r.actualHead||r.budgetedHead||0))*(parseFloat(r.valuePerUnit||r.budgetedPrice||0));
  const iRT=r=>(parseFloat(r.quantity||0))*(parseFloat(r.valuePerUnit||0));
  const crops=data.inspCrops||[],lsRows=data.inspLivestock||[],invRows=data.inspInventory||[],photos=data.inspPhotos||[],loans=data.inspLoans||['','',''];
  const cropTot=crops.reduce((s,r)=>s+cRT(r),0),lsTot=lsRows.reduce((s,r)=>s+lRT(r),0),invTot=invRows.reduce((s,r)=>s+iRT(r),0),grand=cropTot+lsTot+invTot;
  const generateShare=async()=>{
    setShareStatus('generating');setShowShareModal(true);
    try{
      const shareId=Math.random().toString(36).slice(2,10).toUpperCase();
      const pin=String(Math.floor(100000+Math.random()*900000));
      const SUPABASE_URL_L=(window.SUPABASE_URL||'').replace(/\/+$/,'');
      const ANON_KEY_L=window.SUPABASE_ANON_KEY||'';
      if(!SUPABASE_URL_L||SUPABASE_URL_L==='https://YOUR_PROJECT_ID.supabase.co'){
        setShareStatus('error:Supabase not configured. Add your project URL and key to config.js.');return;
      }
      const payload={share_id:shareId,pin,client_name:data.clientName,as_of_date:data.asOfDate||data.inspDate||new Date().toISOString().slice(0,10),
        insp_data:{inspCrops:data.inspCrops||[],inspLivestock:data.inspLivestock||[],inspInventory:data.inspInventory||[],
          inspPastureCond:data.inspPastureCond||'',inspPastureCmt:data.inspPastureCmt||'',inspWaterCond:data.inspWaterCond||'',
          inspWaterCmt:data.inspWaterCmt||'',inspEquipCond:data.inspEquipCond||'',inspEquipCmt:data.inspEquipCmt||'',
          inspEnvCmt:data.inspEnvCmt||'',inspAddlCmt:data.inspAddlCmt||'',clientName:data.clientName,inspDate:data.inspDate},response:null};
      const resp=await fetch(SUPABASE_URL_L+'/rest/v1/inspection_shares',{method:'POST',
        headers:{'Content-Type':'application/json','apikey':ANON_KEY_L,'Authorization':'Bearer '+(currentSession?.access_token||ANON_KEY_L),'Prefer':'return=representation'},
        body:JSON.stringify(payload)});
      if(!resp.ok)throw new Error(await resp.text());
      const origin=window.location.origin;
      setShareLink(origin+'/?id='+shareId);setSharePin(pin);setShareStatus('ready');
      setData(d=>({...d,inspShareId:shareId}));
      const saveKey=STORAGE_PREFIX+data.clientName.replace(/\s+/g,'_')+':'+(data.asOfDate||new Date().toISOString().slice(0,10));
      storage.set(saveKey,JSON.stringify({...data,inspShareId:shareId,_savedAt:new Date().toISOString()})).catch(()=>{});
    }catch(e){setShareStatus('error:'+e.message);}
  };

  const checkCustomerResponse=async()=>{
    setCheckingResponse(true);
    try{
      const sid=data.inspShareId||(shareLink?shareLink.split('id=')[1]:null);
      if(!sid){alert('No share link found. Use "Share with Customer" first.');setCheckingResponse(false);return;}
      const SUPABASE_URL_L=(window.SUPABASE_URL||'').replace(/\/+$/,'');
      const resp=await fetch(SUPABASE_URL_L+'/rest/v1/inspection_shares?share_id=eq.'+sid+'&select=response,responded_at',{headers:supaHeaders()});
      const rows=await resp.json();
      if(rows[0]?.response){
        const cr=rows[0].response;
        setCustomerResponse(cr);
        setData(d=>({...d,
          inspCrops:(d.inspCrops||[]).map((r,i)=>{const c=cr.crops?.[i]||{};return{...r,actualAcres:c.actualAcres||r.actualAcres,condition:c.condition||r.condition,actualYield:c.actualYield||r.actualYield,location:c.location||r.location,deviationReason:c.deviationReason||r.deviationReason};}),
          inspLivestock:(d.inspLivestock||[]).map((r,i)=>{const l=cr.livestock?.[i]||{};return{...r,actualHead:l.actualHead||r.actualHead,condition:l.condition||r.condition,estWeight:l.estWeight||r.estWeight,deviationReason:l.deviationReason||r.deviationReason};}),
          inspPastureCond:cr.pastureCond||d.inspPastureCond,inspPastureCmt:cr.pastureCmt||d.inspPastureCmt,
          inspWaterCond:cr.waterCond||d.inspWaterCond,inspWaterCmt:cr.waterCmt||d.inspWaterCmt,
          inspEquipCond:cr.equipCond||d.inspEquipCond,inspEquipCmt:cr.equipCmt||d.inspEquipCmt,
          inspEnvCmt:cr.envCmt||d.inspEnvCmt,inspAddlCmt:cr.addlCmt||d.inspAddlCmt}));
        alert('✅ Customer response loaded! Their answers have been filled in.');
      }else{alert('No response yet — the customer has not submitted the form.');}
    }catch(e){alert('Error: '+e.message);}
    setCheckingResponse(false);
  };

  const handlePDF=()=>{if(window.html2pdf){window.html2pdf().set({margin:[10,10,10,10],filename:`ag-inspection-${(data.clientName||'report').replace(/\s+/g,'-')}-${data.inspDate||''}.pdf`,image:{type:'jpeg',quality:.92},html2canvas:{scale:2,useCORS:true,logging:false},jsPDF:{unit:'mm',format:'letter',orientation:'portrait'}}).from(printRef.current).save();}else window.print();};
  const handleSubmit=async()=>{setSubmitErr('');setSubmitting(true);try{handlePDF();}catch(e){setSubmitErr('PDF failed: '+e.message);}finally{setSubmitting(false);}};
  if(submitted)return React.createElement('div',{style:{display:'flex',alignItems:'center',justifyContent:'center',padding:48}},React.createElement('div',{style:{background:'white',borderRadius:12,padding:40,textAlign:'center',maxWidth:420}},React.createElement('div',{style:{fontSize:52,marginBottom:12}},'✅'),React.createElement('div',{style:{fontWeight:800,fontSize:22,color:ISH,marginBottom:8}},'Report Complete!'),React.createElement('button',{onClick:()=>setSubmitted(false),style:{background:ISH,color:'white',border:'none',borderRadius:6,padding:'9px 22px',fontWeight:700,cursor:'pointer',marginTop:12}},'New Inspection')));

  const toggleBar = React.createElement('div',{style:{display:'flex',alignItems:'center',gap:0,marginBottom:20,background:'#f0fdf4',borderRadius:8,padding:4,width:'fit-content',border:'1px solid #d1fae5'}},
    React.createElement('button',{type:'button',onClick:()=>setData(d=>({...d,inspMode:'pre'})),style:{padding:'7px 20px',borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer',border:'none',background:data.inspMode==='post'?'transparent':'white',color:data.inspMode==='post'?'#6b7280':ISH,boxShadow:data.inspMode==='post'?'none':'0 1px 3px rgba(0,0,0,.1)',transition:'all .15s'}},'🌱 Pre-Harvest'),
    React.createElement('button',{type:'button',onClick:()=>setData(d=>({...d,inspMode:'post'})),style:{padding:'7px 20px',borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer',border:'none',background:data.inspMode==='post'?'white':'transparent',color:data.inspMode==='post'?ISH:'#6b7280',boxShadow:data.inspMode==='post'?'0 1px 3px rgba(0,0,0,.1)':'none',transition:'all .15s'}},'🏚 Post-Harvest'));

  if(data.inspMode==='post') return React.createElement('div',{style:{maxWidth:1100,margin:'0 auto',padding:'20px 16px'}},toggleBar,React.createElement(PostHarvestView,{data,setData}));

  return React.createElement('div',{style:{maxWidth:1100,margin:'0 auto',padding:'20px 16px'}},
    !window.html2pdf&&React.createElement('script',{src:'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'}),
    toggleBar,
    React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,gap:10,flexWrap:'wrap'}},
      React.createElement('div',null,React.createElement('div',{style:{fontWeight:800,fontSize:18,color:ISH}},'Ag Inspection Report'),React.createElement('div',{style:{fontSize:12,color:'#6b7280'}},'Pre-loaded from Budget tab · Fill in actuals below')),
      React.createElement('div',{style:{display:'flex',gap:8}},
        React.createElement('button',{onClick:generateShare,style:{background:'#2d5a8e',color:'white',border:'none',borderRadius:5,padding:'7px 14px',fontWeight:700,fontSize:12,cursor:'pointer'}},'🔗 Share with Customer'),
        (data.inspShareId||shareLink)&&React.createElement('button',{onClick:checkCustomerResponse,disabled:checkingResponse,style:{background:checkingResponse?'#e5e7eb':'#e8f5ea',color:checkingResponse?'#9ca3af':'#15803d',border:`1.5px solid ${checkingResponse?'#d1d5db':'#22c55e'}`,borderRadius:5,padding:'7px 14px',fontWeight:700,fontSize:12,cursor:checkingResponse?'wait':'pointer'}},checkingResponse?'⏳ Checking...':'📬 Check Response'),
        React.createElement('button',{onClick:handlePDF,style:{background:'#f0fdf4',color:ITH,border:`1.5px solid ${ITH}`,borderRadius:5,padding:'7px 14px',fontWeight:600,fontSize:12,cursor:'pointer'}},'🖨 Save PDF'),
        React.createElement('button',{onClick:handleSubmit,disabled:submitting,style:{background:IGOLD,color:'white',border:'none',borderRadius:5,padding:'8px 18px',fontWeight:700,fontSize:13,cursor:submitting?'wait':'pointer',opacity:submitting?.7:1}},submitting?'⏳ Generating…':'📤 Save PDF Report'))),
    submitErr&&React.createElement('div',{style:{background:'#fef3c7',border:'1px solid #fcd34d',borderRadius:6,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#92400e'}},'⚠️ '+submitErr),
    // ── Share with Customer Modal ──────────────────────────────────────────────
    showShareModal&&React.createElement('div',{style:{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,.55)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}},
      React.createElement('div',{style:{background:'white',borderRadius:14,padding:28,maxWidth:480,width:'100%',boxShadow:'0 10px 50px rgba(0,0,0,.25)'}},
        React.createElement('div',{style:{fontWeight:700,fontSize:'1.05rem',marginBottom:6,color:'#1a1a1a'}},'Share Inspection with Customer'),
        shareStatus==='generating'&&React.createElement('div',{style:{color:'#6b7280',padding:'20px 0',textAlign:'center'}},'Generating secure link...'),
        shareStatus==='ready'&&React.createElement('div',null,
          React.createElement('div',{style:{fontSize:'.85rem',color:'#555',marginBottom:16}},'Send the link and PIN below to your customer. They fill in actual acres, conditions, and yields — you can load their response back here anytime.'),
          React.createElement('div',{style:{background:'#f0f6ff',border:'1px solid #c0d8f0',borderRadius:8,padding:14,marginBottom:12}},
            React.createElement('div',{style:{fontSize:'.72rem',fontWeight:700,color:'#2d5a8e',marginBottom:4,textTransform:'uppercase',letterSpacing:'.05em'}},'Share Link'),
            React.createElement('div',{style:{fontSize:'.82rem',wordBreak:'break-all',color:'#1a1a1a',fontFamily:'monospace',marginBottom:8}},shareLink),
            React.createElement('button',{onClick:()=>navigator.clipboard.writeText(shareLink).then(()=>alert('Copied!')),style:{background:'#2d5a8e',color:'white',border:'none',borderRadius:5,padding:'4px 10px',fontSize:'.75rem',cursor:'pointer',fontWeight:600}},'Copy Link')),
          React.createElement('div',{style:{background:'#f5e8ea',border:'1px solid #e0b0b8',borderRadius:8,padding:14,marginBottom:14}},
            React.createElement('div',{style:{fontSize:'.72rem',fontWeight:700,color:'#6B0E1E',marginBottom:4,textTransform:'uppercase',letterSpacing:'.05em'}},'Customer PIN'),
            React.createElement('div',{style:{fontSize:'2rem',fontWeight:900,letterSpacing:'.25em',color:'#6B0E1E',fontFamily:'monospace'}},sharePin),
            React.createElement('div',{style:{fontSize:'.72rem',color:'#888',marginTop:4}},'Customer must enter this to open the form')),
          React.createElement('button',{onClick:()=>{const subject=encodeURIComponent('Inspection Form - '+data.clientName);const body=encodeURIComponent('Please fill out your crop inspection form.\n\nClick the link to open your form:\n'+shareLink+'\n\nYour PIN: '+sharePin+'\n\nSteps:\n1. Click the link above\n2. Enter your PIN when prompted\n3. Fill in your actual acres, yields, and conditions\n4. Submit the form\n\nThank you,\nFirst Bank of Montana');window.location.href='mailto:?subject='+subject+'&body='+body;},style:{width:'100%',background:'#6B0E1E',color:'white',border:'none',borderRadius:7,padding:'10px 0',fontWeight:700,fontSize:'.9rem',cursor:'pointer',marginBottom:8}},'📧 Open in Email (Outlook / Mail)'),
          React.createElement('button',{onClick:checkCustomerResponse,disabled:checkingResponse,style:{width:'100%',background:'none',border:'1.5px solid #22c55e',borderRadius:7,padding:'8px 0',fontWeight:700,fontSize:'.88rem',cursor:'pointer',color:'#15803d',marginBottom:8}},checkingResponse?'Checking...':'🔄 Check for Customer Response'),
          customerResponse&&React.createElement('div',{style:{background:'#e8f5ea',border:'1px solid #22c55e',borderRadius:7,padding:10,fontSize:'.85rem',color:'#15803d',fontWeight:700,marginBottom:8}},'✅ Customer has responded — answers loaded into the form.')),
        shareStatus.startsWith('error')&&React.createElement('div',{style:{color:'#c44',fontSize:'.85rem',padding:'12px 0'}},'Error: ',shareStatus.slice(6),React.createElement('br'),React.createElement('span',{style:{fontSize:'.75rem',color:'#888'}},'Make sure you ran inspection_shares.sql in Supabase.')),
        React.createElement('button',{onClick:()=>setShowShareModal(false),style:{background:'none',border:'1px solid #ddd',borderRadius:6,padding:'7px 20px',cursor:'pointer',fontFamily:'inherit',fontSize:'.85rem',marginTop:4}},'Close'))),
    React.createElement('div',{style:{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}},[['#22c55e','On Budget (< 5%)'],['#f59e0b','Minor Deviation (5–20%)'],['#dc2626','Major Deviation (> 20%)']].map(([c,l])=>React.createElement('div',{key:l,style:{display:'flex',alignItems:'center',gap:5,fontSize:12,color:'#6b7280'}},React.createElement('div',{style:{width:12,height:12,borderRadius:2,background:c+'30',border:`2px solid ${c}`}}),l))),
    React.createElement('div',{ref:printRef},
      // Header
      React.createElement('div',{style:{background:'white',borderRadius:6,padding:20,marginBottom:20,boxShadow:'0 1px 4px rgba(0,0,0,0.08)',border:'1px solid #d1fae5'}},
        React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 24px'}},
          React.createElement('div',null,React.createElement('label',{style:ILBL},'CUSTOMER NAME'),React.createElement('div',{style:{padding:'6px 8px',background:'#f0fdf4',borderRadius:4,fontSize:13,fontWeight:600,color:ISH}},data.clientName||'—')),
          React.createElement('div',null,React.createElement('label',{style:ILBL},'DATE OF INSPECTION'),iInp(data.inspDate||'',v=>iset('inspDate',v),'','date')),
          React.createElement('div',null,React.createElement('label',{style:ILBL},'INSPECTOR NAME'),iInp(data.inspInspector||'',v=>iset('inspInspector',v),'Enter inspector name')),
          React.createElement('div',null,React.createElement('label',{style:ILBL},'LOAN NUMBER(S)'),React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:5}},loans.map((l,i)=>React.createElement('div',{key:i},iInp(l,v=>setLoan(i,v),`Loan ${i+1}`))))))),
      // Crops table
      React.createElement(ICard,{title:'🌱  CROP CONDITION — Budget vs. Actual'},
        React.createElement('div',{style:{overflowX:'auto'}},
          React.createElement('table',{style:{width:'100%',borderCollapse:'collapse',fontSize:12.5}},
            React.createElement('thead',null,React.createElement('tr',null,['Crop','Budget Ac','Actual Ac','Deviation','Location','Condition','Yield/Ac','Value/Unit','Total',''].map((h,i)=>React.createElement('th',{key:i,style:{...ITHS,minWidth:i===5?190:i===0?100:80,textAlign:i===0||i===4?'left':'center',background:i===1?'#374151':ITH}},h)))),
            React.createElement('tbody',null,crops.map((r,i)=>{
              const pct=devPct(r.actualAcres,r.budgetedAcres),showDev=pct!==null&&Math.abs(pct)>=5,ds=r.actualAcres?devStyle(pct):{};
              return React.createElement(React.Fragment,{key:r.id},
                React.createElement('tr',{style:{background:ds.background||(i%2===0?'white':'#f9fafb'),...(ds.borderLeft?{borderLeft:ds.borderLeft}:{})}},
                  React.createElement('td',{style:ITDS},r.budgetedCrop?React.createElement('div',null,React.createElement('div',{style:{fontWeight:600,fontSize:13}},r.budgetedCrop),r.substituted&&React.createElement('div',{style:{marginTop:4}},React.createElement('div',{style:{fontSize:10,color:'#d97706',fontWeight:700}},'SUBSTITUTED →'),iInp(r.substituteCrop,v=>uC(r.id,'substituteCrop',v),'Actual crop…','text',{fontSize:12})),React.createElement('button',{type:'button',onClick:()=>uC(r.id,'substituted',!r.substituted),style:{marginTop:3,fontSize:10,background:'none',border:'none',color:r.substituted?'#dc2626':'#9ca3af',cursor:'pointer',padding:0,fontWeight:600}},r.substituted?'✕ Remove':'↺ Different crop?')):iInp(r.budgetedCrop,v=>uC(r.id,'budgetedCrop',v),'Crop name…')),
                  React.createElement('td',{style:{...ITDS,textAlign:'center',background:'#f8f6f2'}},React.createElement('div',{style:{fontSize:13,fontWeight:600,color:'#6b7280'}},r.budgetedAcres||'—'),React.createElement('div',{style:{fontSize:10,color:'#9ca3af'}},'budgeted')),
                  React.createElement('td',{style:ITDS},iInp(r.actualAcres,v=>uC(r.id,'actualAcres',v),r.budgetedAcres||'0','number')),
                  React.createElement('td',{style:{...ITDS,textAlign:'center'}},r.actualAcres&&r.budgetedAcres?React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:2}},devBadge(pct),React.createElement('div',{style:{fontSize:10,color:'#6b7280'}},(parseFloat(r.actualAcres||0)-parseFloat(r.budgetedAcres||0)>0?'+':'')+((parseFloat(r.actualAcres||0)-parseFloat(r.budgetedAcres||0)).toFixed(0))+' ac')):React.createElement('span',{style:{color:'#d1d5db',fontSize:11}},'—')),
                  React.createElement('td',{style:ITDS},iInp(r.location,v=>uC(r.id,'location',v),'Field/Sec')),
                  React.createElement('td',{style:ITDS},React.createElement(ICP,{value:r.condition,onChange:v=>uC(r.id,'condition',v)})),
                  React.createElement('td',{style:ITDS},React.createElement('div',{style:{display:'flex',gap:3}},iInp(r.actualYield||r.budgetedYield,v=>uC(r.id,'actualYield',v),r.budgetedYield||'0','number',{flex:1}),React.createElement('div',{style:{fontSize:11,color:'#6b7280',alignSelf:'center',padding:'0 2px'}},r.budgetedUnit||'bu')),r.budgetedYield&&React.createElement('div',{style:{fontSize:10,color:'#9ca3af'}},'budget: '+r.budgetedYield)),
                  React.createElement('td',{style:ITDS},iInp(r.valuePerUnit||r.budgetedPrice,v=>uC(r.id,'valuePerUnit',v),r.budgetedPrice||'$0','number')),
                  React.createElement('td',{style:{...ITDS,textAlign:'right',fontWeight:700,color:'#15803d',whiteSpace:'nowrap'}},cRT(r)>0?iFmt$(cRT(r)):'—'),
                  React.createElement('td',{style:ITDS},React.createElement('button',{type:'button',onClick:()=>rC(r.id),style:{background:'#fee2e2',color:'#b91c1c',border:'none',borderRadius:4,padding:'2px 7px',cursor:'pointer',fontSize:14}},'×'))),
                showDev&&React.createElement('tr',{style:{background:Math.abs(pct)>=20?'#fef2f2':'#fffbeb'}},
                  React.createElement('td',{colSpan:10,style:{padding:'6px 10px 8px 32px',borderBottom:'1px solid #f0f0f0'}},
                    React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8}},
                      React.createElement('span',{style:{fontSize:11,fontWeight:700,color:Math.abs(pct)>=20?'#dc2626':'#d97706',whiteSpace:'nowrap'}},Math.abs(pct)>=20?'⛔':'⚠️',' Deviation reason:'),
                      iInp(r.deviationReason,v=>uC(r.id,'deviationReason',v),Math.abs(pct)>=20?'Required — explain major deviation…':'Explain deviation…','text',{border:`1px solid ${Math.abs(pct)>=20?'#fca5a5':'#fcd34d'}`,background:'white'})))));
            })),
            React.createElement('tfoot',null,React.createElement('tr',{style:{background:'#ecfdf5'}},React.createElement('td',{colSpan:8,style:{...ITDS,textAlign:'right',fontWeight:700,color:ISH,fontSize:13}},'CROP TOTAL'),React.createElement('td',{style:{...ITDS,textAlign:'right',fontWeight:700,color:'#15803d',fontSize:14}},iFmt$(cropTot)),React.createElement('td',null))))),
        React.createElement('button',{type:'button',onClick:aC,style:{marginTop:10,background:'#f0fdf4',color:ITH,border:`1.5px dashed ${ITH}`,borderRadius:4,padding:'5px 14px',cursor:'pointer',fontSize:13,fontWeight:600}},'+ Add Crop Row'),
        React.createElement('div',{style:{marginTop:12}},React.createElement('label',{style:ILBL},'Comments'),iTa(data.inspCropCmt||'',v=>iset('inspCropCmt',v),'Crop condition observations…'))),
      // Livestock table
      React.createElement(ICard,{title:'🐄  LIVESTOCK CONDITION — Budget vs. Actual'},
        React.createElement('div',{style:{overflowX:'auto'}},
          React.createElement('table',{style:{width:'100%',borderCollapse:'collapse',fontSize:12.5}},
            React.createElement('thead',null,React.createElement('tr',null,['Type','Budget Hd','Actual Hd','Deviation','Location','Condition','Est. Wt','Value/Hd','Total',''].map((h,i)=>React.createElement('th',{key:i,style:{...ITHS,minWidth:i===5?190:80,textAlign:i===0||i===4?'left':'center',background:i===1?'#374151':ITH}},h)))),
            React.createElement('tbody',null,lsRows.map((r,i)=>{
              const pct=devPct(r.actualHead,r.budgetedHead),showDev=pct!==null&&Math.abs(pct)>=5,ds=r.actualHead?devStyle(pct):{};
              return React.createElement(React.Fragment,{key:r.id},
                React.createElement('tr',{style:{background:ds.background||(i%2===0?'white':'#f9fafb'),...(ds.borderLeft?{borderLeft:ds.borderLeft}:{})}},
                  React.createElement('td',{style:ITDS},r.budgetedType?React.createElement('div',{style:{fontWeight:600,fontSize:13}},r.budgetedType):iInp(r.budgetedType,v=>uL(r.id,'budgetedType',v),'Cattle, Hogs…')),
                  React.createElement('td',{style:{...ITDS,textAlign:'center',background:'#f8f6f2'}},React.createElement('div',{style:{fontSize:13,fontWeight:600,color:'#6b7280'}},r.budgetedHead||'—'),React.createElement('div',{style:{fontSize:10,color:'#9ca3af'}},'budgeted')),
                  React.createElement('td',{style:ITDS},iInp(r.actualHead,v=>uL(r.id,'actualHead',v),r.budgetedHead||'0','number')),
                  React.createElement('td',{style:{...ITDS,textAlign:'center'}},r.actualHead&&r.budgetedHead?React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:2}},devBadge(pct),React.createElement('div',{style:{fontSize:10,color:'#6b7280'}},(parseFloat(r.actualHead||0)-parseFloat(r.budgetedHead||0)>0?'+':'')+((parseFloat(r.actualHead||0)-parseFloat(r.budgetedHead||0)).toFixed(0))+' hd')):React.createElement('span',{style:{color:'#d1d5db',fontSize:11}},'—')),
                  React.createElement('td',{style:ITDS},iInp(r.location,v=>uL(r.id,'location',v),'Pasture/Lot')),
                  React.createElement('td',{style:ITDS},React.createElement(ICP,{value:r.condition,onChange:v=>uL(r.id,'condition',v)})),
                  React.createElement('td',{style:ITDS},iInp(r.estWeight,v=>uL(r.id,'estWeight',v),r.budgetedLbs||'0','number')),
                  React.createElement('td',{style:ITDS},iInp(r.valuePerUnit,v=>uL(r.id,'valuePerUnit',v),r.budgetedPrice||'$0','number')),
                  React.createElement('td',{style:{...ITDS,textAlign:'right',fontWeight:700,color:'#15803d'}},lRT(r)>0?iFmt$(lRT(r)):'—'),
                  React.createElement('td',{style:ITDS},React.createElement('button',{type:'button',onClick:()=>rL(r.id),style:{background:'#fee2e2',color:'#b91c1c',border:'none',borderRadius:4,padding:'2px 7px',cursor:'pointer',fontSize:14}},'×'))),
                showDev&&React.createElement('tr',{style:{background:Math.abs(pct)>=20?'#fef2f2':'#fffbeb'}},React.createElement('td',{colSpan:10,style:{padding:'6px 10px 8px 32px'}},React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8}},React.createElement('span',{style:{fontSize:11,fontWeight:700,color:Math.abs(pct)>=20?'#dc2626':'#d97706',whiteSpace:'nowrap'}},Math.abs(pct)>=20?'⛔':'⚠️',' Deviation reason:'),iInp(r.deviationReason,v=>uL(r.id,'deviationReason',v),'Explain deviation from budget…','text',{border:`1px solid ${Math.abs(pct)>=20?'#fca5a5':'#fcd34d'}`,background:'white'})))));
            })),
            React.createElement('tfoot',null,React.createElement('tr',{style:{background:'#ecfdf5'}},React.createElement('td',{colSpan:8,style:{...ITDS,textAlign:'right',fontWeight:700,color:ISH,fontSize:13}},'LIVESTOCK TOTAL'),React.createElement('td',{style:{...ITDS,textAlign:'right',fontWeight:700,color:'#15803d',fontSize:14}},iFmt$(lsTot)),React.createElement('td',null))))),
        React.createElement('button',{type:'button',onClick:aL,style:{marginTop:10,background:'#f0fdf4',color:ITH,border:`1.5px dashed ${ITH}`,borderRadius:4,padding:'5px 14px',cursor:'pointer',fontSize:13,fontWeight:600}},'+ Add Livestock Row'),
        React.createElement('div',{style:{marginTop:12}},React.createElement('label',{style:ILBL},'Comments'),iTa(data.inspLsCmt||'',v=>iset('inspLsCmt',v),'Livestock observations…'))),
      // Inventory table
      React.createElement(ICard,{title:'🏚  INVENTORY (Stored Crop / Feed)'},
        React.createElement('div',{style:{overflowX:'auto'}},
          React.createElement('table',{style:{width:'100%',borderCollapse:'collapse',fontSize:12.5}},
            React.createElement('thead',null,React.createElement('tr',null,['Description','Location','Condition','Quantity','Unit','Value/Unit','Total',''].map((h,i)=>React.createElement('th',{key:i,style:{...ITHS,minWidth:i===2?190:80,textAlign:i===0||i===1?'left':'center'}},h)))),
            React.createElement('tbody',null,invRows.map((r,i)=>React.createElement('tr',{key:r.id,style:{background:i%2===0?'white':'#f0fdf4'}},
              React.createElement('td',{style:ITDS},iInp(r.description,v=>uI(r.id,'description',v),'Corn, Soybeans…')),
              React.createElement('td',{style:ITDS},iInp(r.location,v=>uI(r.id,'location',v),'Bin/Facility')),
              React.createElement('td',{style:ITDS},React.createElement(ICP,{value:r.condition,onChange:v=>uI(r.id,'condition',v)})),
              React.createElement('td',{style:ITDS},iInp(r.quantity,v=>uI(r.id,'quantity',v),'0','number')),
              React.createElement('td',{style:ITDS},React.createElement('select',{value:r.unitType||'bu',onChange:e=>uI(r.id,'unitType',e.target.value),style:{border:'1px solid #d1d5db',borderRadius:4,padding:'4px 5px',fontSize:12,width:'100%',background:'white',outline:'none'}},['bu','ton','bale','cwt','lb','gal','head','ea'].map(u=>React.createElement('option',{key:u},u)))),
              React.createElement('td',{style:ITDS},iInp(r.valuePerUnit,v=>uI(r.id,'valuePerUnit',v),'$0','number')),
              React.createElement('td',{style:{...ITDS,textAlign:'right',fontWeight:700,color:'#15803d'}},iRT(r)>0?iFmt$(iRT(r)):'—'),
              React.createElement('td',{style:ITDS},React.createElement('button',{type:'button',onClick:()=>rI(r.id),style:{background:'#fee2e2',color:'#b91c1c',border:'none',borderRadius:4,padding:'2px 7px',cursor:'pointer',fontSize:14}},'×'))))),
            React.createElement('tfoot',null,React.createElement('tr',{style:{background:'#ecfdf5'}},React.createElement('td',{colSpan:6,style:{...ITDS,textAlign:'right',fontWeight:700,color:ISH,fontSize:13}},'INVENTORY TOTAL'),React.createElement('td',{style:{...ITDS,textAlign:'right',fontWeight:700,color:'#15803d',fontSize:14}},iFmt$(invTot)),React.createElement('td',null))))),
        React.createElement('button',{type:'button',onClick:aI,style:{marginTop:10,background:'#f0fdf4',color:ITH,border:`1.5px dashed ${ITH}`,borderRadius:4,padding:'5px 14px',cursor:'pointer',fontSize:13,fontWeight:600}},'+ Add Inventory Row'),
        React.createElement('div',{style:{marginTop:12}},React.createElement('label',{style:ILBL},'Comments'),iTa(data.inspInvCmt||'',v=>iset('inspInvCmt',v),'Inventory observations…'))),
      // Simple sections
      ...[['🟤  PASTURE CONDITIONS','inspPastureCond','inspPastureCmt','Pasture conditions…',INSP_CONDITIONS],['💧  WATER / IRRIGATION SOURCE','inspWaterCond','inspWaterCmt','Water / irrigation notes…',INSP_WATER_COND],['🚜  EQUIPMENT','inspEquipCond','inspEquipCmt','Equipment condition notes…',INSP_CONDITIONS]].map(([title,ck,mk,ph,opts])=>React.createElement(ICard,{key:ck,title},React.createElement('div',{style:{display:'grid',gridTemplateColumns:'auto 1fr',gap:'0 24px',alignItems:'start'}},React.createElement('div',{style:{minWidth:260}},React.createElement('label',{style:ILBL},'Overall Condition'),React.createElement(ICP,{value:data[ck]||'',onChange:v=>iset(ck,v),options:opts})),React.createElement('div',null,React.createElement('label',{style:ILBL},'Comments'),iTa(data[mk]||'',v=>iset(mk,v),ph,2))))),
      React.createElement(ICard,{title:'🌿  ENVIRONMENTAL OBSERVATIONS'},iTa(data.inspEnvCmt||'',v=>iset('inspEnvCmt',v),'Soil erosion, drainage, weed pressure…',4)),
      React.createElement(ICard,{title:'📋  ADDITIONAL OBSERVATIONS / OVERALL OPERATION'},iTa(data.inspAddlCmt||'',v=>iset('inspAddlCmt',v),'Overall operation comments…',4)),
      // Financial summary
      React.createElement('div',{style:{background:ISH,borderRadius:6,padding:'14px 20px',marginBottom:20}},
        React.createElement('div',{style:{fontSize:11,color:'rgba(255,255,255,.55)',letterSpacing:2,marginBottom:10,textTransform:'uppercase',fontWeight:700}},'Financial Summary'),
        React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}},[['Crop Value',cropTot],['Livestock Value',lsTot],['Inventory Value',invTot],['GRAND TOTAL',grand]].map(([label,val])=>React.createElement('div',{key:label,style:{background:label==='GRAND TOTAL'?'rgba(200,134,10,0.2)':'rgba(255,255,255,.07)',borderRadius:5,padding:'10px 12px',textAlign:'center',border:`1px solid ${label==='GRAND TOTAL'?IGOLD:'rgba(255,255,255,.1)'}`}},React.createElement('div',{style:{fontSize:10,color:'rgba(255,255,255,.55)',letterSpacing:.5,marginBottom:4,textTransform:'uppercase'}},label),React.createElement('div',{style:{fontSize:label==='GRAND TOTAL'?20:16,fontWeight:700,color:label==='GRAND TOTAL'?IGOLD:'white'}},iFmt$(val)))))),
      // Deviation summary
      crops.some(r=>{const p=devPct(r.actualAcres,r.budgetedAcres);return p!==null&&Math.abs(p)>=5;})&&React.createElement('div',{style:{background:'#fffbeb',border:'2px solid #f59e0b',borderRadius:6,padding:16,marginBottom:20}},
        React.createElement('div',{style:{fontWeight:700,fontSize:14,color:'#92400e',marginBottom:10}},'⚠️ Budget Deviation Summary'),
        crops.filter(r=>{const p=devPct(r.actualAcres,r.budgetedAcres);return p!==null&&Math.abs(p)>=5;}).map(r=>{const p=devPct(r.actualAcres,r.budgetedAcres),ac=parseFloat(r.actualAcres||0)-parseFloat(r.budgetedAcres||0);return React.createElement('div',{key:r.id,style:{display:'flex',gap:12,alignItems:'flex-start',padding:'6px 0',borderBottom:'1px solid #fcd34d'}},React.createElement('div',{style:{fontSize:13,fontWeight:700,minWidth:80,color:Math.abs(p)>=20?'#dc2626':'#d97706'}},r.budgetedCrop||'—'),React.createElement('div',{style:{fontSize:12,color:'#92400e'}},'Budget: ',React.createElement('strong',null,r.budgetedAcres,' ac'),' → Actual: ',React.createElement('strong',null,r.actualAcres,' ac'),React.createElement('span',{style:{marginLeft:6,fontWeight:700}},(ac>0?'+':'')+ac.toFixed(0)+' ac ('+p.toFixed(1)+'%)'),r.substituted&&r.substituteCrop&&React.createElement('span',{style:{marginLeft:6,background:'#fef3c7',padding:'1px 5px',borderRadius:3}},'Sub: '+r.substituteCrop)),r.deviationReason&&React.createElement('div',{style:{fontSize:11,color:'#78350f',fontStyle:'italic',flex:1}},'"'+r.deviationReason+'"'));})),
      // Photos
      React.createElement('div',{style:{borderRadius:6,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.1)',border:'1px solid #d1fae5',marginBottom:20}},
        React.createElement('div',{style:{background:ISH,padding:'9px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}},
          React.createElement('span',{style:{color:'white',fontWeight:700,fontSize:15}},'📸  INSPECTION PHOTOS'),
          React.createElement('div',{style:{display:'flex',gap:8}},
            React.createElement('button',{type:'button',onClick:()=>camRef.current?.click(),style:{background:'rgba(255,255,255,.14)',color:'white',border:'1px solid rgba(255,255,255,.35)',borderRadius:4,padding:'4px 12px',cursor:'pointer',fontSize:12,fontWeight:600}},'📷 Camera'),
            React.createElement('button',{type:'button',onClick:()=>fileRef.current?.click(),style:{background:'rgba(255,255,255,.14)',color:'white',border:'1px solid rgba(255,255,255,.35)',borderRadius:4,padding:'4px 12px',cursor:'pointer',fontSize:12,fontWeight:600}},'📁 Upload'),
            React.createElement('input',{ref:camRef,type:'file',accept:'image/*',capture:'environment',onChange:handleFiles,style:{display:'none'}}),
            React.createElement('input',{ref:fileRef,type:'file',accept:'image/*',multiple:true,onChange:handleFiles,style:{display:'none'}}))),
        React.createElement('div',{style:{background:'white',padding:16}},
          photos.length===0?React.createElement('div',{style:{textAlign:'center',padding:24,color:'#9ca3af',fontSize:14}},'No photos yet — use Camera or Upload above'):
          React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}},photos.map(ph=>React.createElement('div',{key:ph.id,style:{border:'1px solid #e5e7eb',borderRadius:6,overflow:'hidden',position:'relative'}},React.createElement('img',{src:ph.src,alt:ph.label||'Photo',style:{width:'100%',height:140,objectFit:'cover',display:'block'}}),React.createElement('div',{style:{padding:'6px 8px'}},React.createElement('input',{value:ph.label,onChange:e=>setData(d=>({...d,inspPhotos:d.inspPhotos.map(x=>x.id===ph.id?{...x,label:e.target.value}:x)})),placeholder:'Add caption…',style:{border:'1px solid #e5e7eb',borderRadius:4,padding:'3px 6px',fontSize:11,width:'100%',boxSizing:'border-box',outline:'none',fontFamily:'inherit'}}),React.createElement('div',{style:{fontSize:10,color:'#9ca3af',marginTop:2}},ph.ts)),React.createElement('button',{type:'button',onClick:()=>setData(d=>({...d,inspPhotos:d.inspPhotos.filter(x=>x.id!==ph.id)})),style:{position:'absolute',top:5,right:5,background:'rgba(185,28,28,.8)',color:'white',border:'none',borderRadius:999,width:22,height:22,cursor:'pointer',fontSize:14,lineHeight:'22px',textAlign:'center'}},'×')))))),
      // Signature
      React.createElement('div',{style:{background:'white',borderRadius:6,padding:20,marginBottom:20,border:'1px solid #d1fae5'}},
        React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:28}},
          React.createElement('div',null,React.createElement('label',{style:ILBL},'INSPECTOR SIGNATURE'),React.createElement('div',{style:{borderBottom:'2px solid #374151',height:44,marginTop:8}}),React.createElement('div',{style:{fontSize:11,color:'#9ca3af',marginTop:4}},'Signature')),
          React.createElement('div',null,React.createElement('label',{style:ILBL},'DATE'),React.createElement('div',{style:{borderBottom:'2px solid #374151',height:44,marginTop:8,display:'flex',alignItems:'flex-end',paddingBottom:6,fontSize:14,color:'#374151'}},data.inspDate?new Date(data.inspDate+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}):''))))),
    React.createElement('div',{style:{textAlign:'center',padding:'20px 0 32px'}},
      React.createElement('button',{onClick:handleSubmit,disabled:submitting,style:{background:ISH,color:'white',border:'none',borderRadius:6,padding:'13px 40px',fontWeight:700,fontSize:16,cursor:submitting?'wait':'pointer',opacity:submitting?.7:1,boxShadow:'0 3px 12px rgba(27,67,50,.3)'}},submitting?'⏳ Generating…':'📤 Save PDF Report'),
      React.createElement('div',{style:{fontSize:11,color:'#9ca3af',marginTop:8}},'Generates a PDF of the full inspection')));
}


// ── Post-Harvest Storage View ─────────────────────────────────────────────────
const newStorage = () => ({id:inspUid(),commodity:'',location:'',quantity:'',unit:'bu',moisture:'',condition:'',valuePerUnit:'',notes:''});

function PostHarvestView({data,setData}){
  const fileRef=React.useRef(null),camRef=React.useRef(null),printRef=React.useRef(null);
  const [submitting,setSubmitting]=React.useState(false),[submitErr,setSubmitErr]=React.useState('');
  const iset=(f,v)=>setData(d=>({...d,[f]:v}));
  const storage=data.postStorage||[];
  const photos=data.postPhotos||[];
  const loans=data.inspLoans||['','',''];
  React.useEffect(()=>{if(!data.postStorage||data.postStorage.length===0)setData(d=>({...d,postStorage:[newStorage()]}));},[]);
  const uS=(id,f,v)=>setData(d=>({...d,postStorage:d.postStorage.map(r=>r.id===id?{...r,[f]:v}:r)}));
  const aS=()=>setData(d=>({...d,postStorage:[...d.postStorage,newStorage()]}));
  const rS=id=>setData(d=>({...d,postStorage:d.postStorage.filter(r=>r.id!==id)}));
  const handleFiles=e=>{Array.from(e.target.files).forEach(f=>{const r=new FileReader();r.onload=ev=>setData(d=>({...d,postPhotos:[...(d.postPhotos||[]),{id:inspUid(),src:ev.target.result,label:'',ts:new Date().toLocaleString()}]}));r.readAsDataURL(f);});e.target.value='';};
  const rowTot=r=>(parseFloat(r.quantity||0))*(parseFloat(r.valuePerUnit||0));
  const grandTot=storage.reduce((s,r)=>s+rowTot(r),0);
  const handlePDF=()=>{if(window.html2pdf){window.html2pdf().set({margin:[10,10,10,10],filename:`post-harvest-${(data.clientName||'report').replace(/\s+/g,'-')}-${data.inspDate||''}.pdf`,image:{type:'jpeg',quality:.92},html2canvas:{scale:2,useCORS:true,logging:false},jsPDF:{unit:'mm',format:'letter',orientation:'portrait'}}).from(printRef.current).save();}else window.print();};

  return React.createElement('div',{style:{maxWidth:1100,margin:'0 auto',padding:'20px 16px'}},
    React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,gap:10,flexWrap:'wrap'}},
      React.createElement('div',null,React.createElement('div',{style:{fontWeight:800,fontSize:18,color:ISH}},'Post-Harvest Storage Inspection'),React.createElement('div',{style:{fontSize:12,color:'#6b7280'}},'Record what is in bins and storage after harvest')),
      React.createElement('button',{onClick:handlePDF,style:{background:IGOLD,color:'white',border:'none',borderRadius:5,padding:'8px 18px',fontWeight:700,fontSize:13,cursor:'pointer'}},'📤 Save PDF Report')),
    submitErr&&React.createElement('div',{style:{background:'#fef3c7',border:'1px solid #fcd34d',borderRadius:6,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#92400e'}},'⚠️ '+submitErr),
    React.createElement('div',{ref:printRef},
      // Header
      React.createElement('div',{style:{background:'white',borderRadius:6,padding:20,marginBottom:20,boxShadow:'0 1px 4px rgba(0,0,0,.08)',border:'1px solid #d1fae5'}},
        React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 24px'}},
          React.createElement('div',null,React.createElement('label',{style:ILBL},'CUSTOMER NAME'),React.createElement('div',{style:{padding:'6px 8px',background:'#f0fdf4',borderRadius:4,fontSize:13,fontWeight:600,color:ISH}},data.clientName||'—')),
          React.createElement('div',null,React.createElement('label',{style:ILBL},'DATE OF INSPECTION'),iInp(data.inspDate||'',v=>iset('inspDate',v),'','date')),
          React.createElement('div',null,React.createElement('label',{style:ILBL},'INSPECTOR NAME'),iInp(data.inspInspector||'',v=>iset('inspInspector',v),'Enter inspector name')),
          React.createElement('div',null,React.createElement('label',{style:ILBL},'LOAN NUMBER(S)'),React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:5}},loans.map((l,i)=>React.createElement('div',{key:i},iInp(l,v=>setData(d=>({...d,inspLoans:d.inspLoans.map((x,j)=>j===i?v:x)})),`Loan ${i+1}`))))))),
      // Storage table
      React.createElement(ICard,{title:'🏚  POST-HARVEST STORAGE INVENTORY'},
        React.createElement('div',{style:{overflowX:'auto'}},
          React.createElement('table',{style:{width:'100%',borderCollapse:'collapse',fontSize:12.5}},
            React.createElement('thead',null,React.createElement('tr',null,
              ['Commodity','Bin / Location','Quantity','Unit','Moisture %','Condition','Est. Value / Unit','Total Value','Notes',''].map((h,i)=>React.createElement('th',{key:i,style:{...ITHS,minWidth:i===4?90:i===5?190:80,textAlign:i===0||i===1||i===8?'left':'center'}},h)))),
            React.createElement('tbody',null,storage.map((r,i)=>React.createElement('tr',{key:r.id,style:{background:i%2===0?'white':'#f0fdf4'}},
              React.createElement('td',{style:ITDS},iInp(r.commodity,v=>uS(r.id,'commodity',v),'Corn, Wheat…')),
              React.createElement('td',{style:ITDS},iInp(r.location,v=>uS(r.id,'location',v),'Bin #1, East Shed…')),
              React.createElement('td',{style:ITDS},iInp(r.quantity,v=>uS(r.id,'quantity',v),'0','number')),
              React.createElement('td',{style:ITDS},React.createElement('select',{value:r.unit||'bu',onChange:e=>uS(r.id,'unit',e.target.value),style:{border:'1px solid #d1d5db',borderRadius:4,padding:'4px 5px',fontSize:12,width:'100%',background:'white',outline:'none'}},['bu','ton','bale','cwt','lb'].map(u=>React.createElement('option',{key:u},u)))),
              React.createElement('td',{style:ITDS},iInp(r.moisture,v=>uS(r.id,'moisture',v),'14.5','number')),
              React.createElement('td',{style:{...ITDS,minWidth:190}},React.createElement(ICP,{value:r.condition,onChange:v=>uS(r.id,'condition',v)})),
              React.createElement('td',{style:ITDS},iInp(r.valuePerUnit,v=>uS(r.id,'valuePerUnit',v),'$0','number')),
              React.createElement('td',{style:{...ITDS,textAlign:'right',fontWeight:700,color:'#15803d',whiteSpace:'nowrap'}},rowTot(r)>0?iFmt$(rowTot(r)):'—'),
              React.createElement('td',{style:ITDS},iInp(r.notes,v=>uS(r.id,'notes',v),'Quality notes…')),
              React.createElement('td',{style:ITDS},React.createElement('button',{type:'button',onClick:()=>rS(r.id),style:{background:'#fee2e2',color:'#b91c1c',border:'none',borderRadius:4,padding:'2px 7px',cursor:'pointer',fontSize:14}},'×'))))),
            React.createElement('tfoot',null,React.createElement('tr',{style:{background:'#ecfdf5'}},React.createElement('td',{colSpan:7,style:{...ITDS,textAlign:'right',fontWeight:700,color:ISH,fontSize:13}},'STORAGE TOTAL'),React.createElement('td',{style:{...ITDS,textAlign:'right',fontWeight:700,color:'#15803d',fontSize:14}},iFmt$(grandTot)),React.createElement('td',{colSpan:2}))))),
        React.createElement('button',{type:'button',onClick:aS,style:{marginTop:10,background:'#f0fdf4',color:ITH,border:`1.5px dashed ${ITH}`,borderRadius:4,padding:'5px 14px',cursor:'pointer',fontSize:13,fontWeight:600}},'+ Add Storage Row'),
        React.createElement('div',{style:{marginTop:12}},React.createElement('label',{style:ILBL},'Comments'),iTa(data.postStorageCmt||'',v=>iset('postStorageCmt',v),'Storage condition comments…'))),
      // Condition sections
      ...[['🟤  PASTURE CONDITIONS','postPastureCond','postPastureCmt','Pasture conditions…',INSP_CONDITIONS],['💧  WATER / IRRIGATION SOURCE','postWaterCond','postWaterCmt','Water / irrigation notes…',INSP_WATER_COND],['🚜  EQUIPMENT','postEquipCond','postEquipCmt','Equipment condition notes…',INSP_CONDITIONS]].map(([title,ck,mk,ph,opts])=>React.createElement(ICard,{key:ck,title},React.createElement('div',{style:{display:'grid',gridTemplateColumns:'auto 1fr',gap:'0 24px',alignItems:'start'}},React.createElement('div',{style:{minWidth:260}},React.createElement('label',{style:ILBL},'Overall Condition'),React.createElement(ICP,{value:data[ck]||'',onChange:v=>iset(ck,v),options:opts})),React.createElement('div',null,React.createElement('label',{style:ILBL},'Comments'),iTa(data[mk]||'',v=>iset(mk,v),ph,2))))),
      React.createElement(ICard,{title:'🌿  ENVIRONMENTAL OBSERVATIONS'},iTa(data.postEnvCmt||'',v=>iset('postEnvCmt',v),'Soil erosion, drainage, field conditions after harvest…',4)),
      React.createElement(ICard,{title:'📋  ADDITIONAL OBSERVATIONS'},iTa(data.postAddlCmt||'',v=>iset('postAddlCmt',v),'Overall post-harvest operation comments…',4)),
      // Financial summary
      React.createElement('div',{style:{background:ISH,borderRadius:6,padding:'14px 20px',marginBottom:20}},
        React.createElement('div',{style:{fontSize:11,color:'rgba(255,255,255,.55)',letterSpacing:2,marginBottom:10,textTransform:'uppercase',fontWeight:700}},'Post-Harvest Storage Value'),
        React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}},
          storage.filter(r=>r.commodity).reduce((acc,r)=>{const existing=acc.find(a=>a.commodity===r.commodity);if(existing)existing.total+=rowTot(r);else acc.push({commodity:r.commodity,total:rowTot(r)});return acc;},[]).map(c=>React.createElement('div',{key:c.commodity,style:{background:'rgba(255,255,255,.07)',borderRadius:5,padding:'10px 12px',textAlign:'center',border:'1px solid rgba(255,255,255,.1)'}},React.createElement('div',{style:{fontSize:10,color:'rgba(255,255,255,.55)',letterSpacing:.5,marginBottom:4,textTransform:'uppercase'}},c.commodity),React.createElement('div',{style:{fontSize:16,fontWeight:700,color:'white'}},iFmt$(c.total)))),
          React.createElement('div',{style:{background:'rgba(200,134,10,.2)',borderRadius:5,padding:'10px 12px',textAlign:'center',border:`1px solid ${IGOLD}`}},React.createElement('div',{style:{fontSize:10,color:'rgba(255,255,255,.55)',letterSpacing:.5,marginBottom:4,textTransform:'uppercase'}},'TOTAL STORAGE VALUE'),React.createElement('div',{style:{fontSize:20,fontWeight:700,color:IGOLD}},iFmt$(grandTot))))),
      // Photos
      React.createElement('div',{style:{borderRadius:6,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.1)',border:'1px solid #d1fae5',marginBottom:20}},
        React.createElement('div',{style:{background:ISH,padding:'9px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}},
          React.createElement('span',{style:{color:'white',fontWeight:700,fontSize:15}},'📸  INSPECTION PHOTOS'),
          React.createElement('div',{style:{display:'flex',gap:8}},
            React.createElement('button',{type:'button',onClick:()=>camRef.current?.click(),style:{background:'rgba(255,255,255,.14)',color:'white',border:'1px solid rgba(255,255,255,.35)',borderRadius:4,padding:'4px 12px',cursor:'pointer',fontSize:12,fontWeight:600}},'📷 Camera'),
            React.createElement('button',{type:'button',onClick:()=>fileRef.current?.click(),style:{background:'rgba(255,255,255,.14)',color:'white',border:'1px solid rgba(255,255,255,.35)',borderRadius:4,padding:'4px 12px',cursor:'pointer',fontSize:12,fontWeight:600}},'📁 Upload'),
            React.createElement('input',{ref:camRef,type:'file',accept:'image/*',capture:'environment',onChange:handleFiles,style:{display:'none'}}),
            React.createElement('input',{ref:fileRef,type:'file',accept:'image/*',multiple:true,onChange:handleFiles,style:{display:'none'}}))),
        React.createElement('div',{style:{background:'white',padding:16}},
          photos.length===0?React.createElement('div',{style:{textAlign:'center',padding:24,color:'#9ca3af',fontSize:14}},'No photos yet'):
          React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}},photos.map(ph=>React.createElement('div',{key:ph.id,style:{border:'1px solid #e5e7eb',borderRadius:6,overflow:'hidden',position:'relative'}},React.createElement('img',{src:ph.src,alt:ph.label||'Photo',style:{width:'100%',height:140,objectFit:'cover',display:'block'}}),React.createElement('div',{style:{padding:'6px 8px'}},React.createElement('input',{value:ph.label,onChange:e=>setData(d=>({...d,postPhotos:d.postPhotos.map(x=>x.id===ph.id?{...x,label:e.target.value}:x)})),placeholder:'Add caption…',style:{border:'1px solid #e5e7eb',borderRadius:4,padding:'3px 6px',fontSize:11,width:'100%',boxSizing:'border-box',outline:'none',fontFamily:'inherit'}}),React.createElement('div',{style:{fontSize:10,color:'#9ca3af',marginTop:2}},ph.ts)),React.createElement('button',{type:'button',onClick:()=>setData(d=>({...d,postPhotos:d.postPhotos.filter(x=>x.id!==ph.id)})),style:{position:'absolute',top:5,right:5,background:'rgba(185,28,28,.8)',color:'white',border:'none',borderRadius:999,width:22,height:22,cursor:'pointer',fontSize:14,lineHeight:'22px',textAlign:'center'}},'×')))))),
      // Signature
      React.createElement('div',{style:{background:'white',borderRadius:6,padding:20,marginBottom:20,border:'1px solid #d1fae5'}},
        React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:28}},
          React.createElement('div',null,React.createElement('label',{style:ILBL},'INSPECTOR SIGNATURE'),React.createElement('div',{style:{borderBottom:'2px solid #374151',height:44,marginTop:8}}),React.createElement('div',{style:{fontSize:11,color:'#9ca3af',marginTop:4}},'Signature')),
          React.createElement('div',null,React.createElement('label',{style:ILBL},'DATE'),React.createElement('div',{style:{borderBottom:'2px solid #374151',height:44,marginTop:8,display:'flex',alignItems:'flex-end',paddingBottom:6,fontSize:14,color:'#374151'}},data.inspDate?new Date(data.inspDate+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}):''))))),
    React.createElement('div',{style:{textAlign:'center',padding:'20px 0 32px'}},
      React.createElement('button',{onClick:handlePDF,disabled:submitting,style:{background:ISH,color:'white',border:'none',borderRadius:6,padding:'13px 40px',fontWeight:700,fontSize:16,cursor:'pointer',boxShadow:'0 3px 12px rgba(27,67,50,.3)'}},'📤 Save PDF Report')));
}

// ── Share Budget Modal ────────────────────────────────────────────────────────
const EMAIL_CONFIG = {
  serviceId:  'YOUR_SERVICE_ID',
  templateId: 'YOUR_TEMPLATE_ID',
  publicKey:  'YOUR_PUBLIC_KEY',
};

function ShareBudgetModal({data,budgetTotalIncome,budgetTotalExpenses,budgetCropTotal,budgetLivestockTotal,budgetMiscTotal,budgetOperatingExpenses,budgetTotalDebtService,onClose}){
  const [email,setEmail]=React.useState('');
  const [sending,setSending]=React.useState(false);
  const [sent,setSent]=React.useState(false);
  const [err,setErr]=React.useState('');
  const printRef=React.useRef(null);
  const net=budgetTotalIncome-budgetTotalExpenses;
  const fmt=v=>`$${(parseFloat(v)||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})}`;

  const handleSend=async()=>{
    if(!email.trim()){setErr('Please enter an email address.');return;}
    setErr('');setSending(true);
    try{
      // Generate PDF
      let pdfData=null;
      if(window.html2pdf){
        const b64=await window.html2pdf().set({margin:[15,15,15,15],filename:`budget-summary-${(data.clientName||'').replace(/\s+/g,'-')}.pdf`,image:{type:'jpeg',quality:.92},html2canvas:{scale:2,useCORS:true,logging:false},jsPDF:{unit:'mm',format:'letter',orientation:'portrait'}}).from(printRef.current).outputPdf('datauristring');
        pdfData=b64.split(',')[1];
      }
      if(EMAIL_CONFIG.serviceId==='YOUR_SERVICE_ID'){
        // No EmailJS — just download
        if(window.html2pdf)window.html2pdf().set({margin:[15,15,15,15],filename:`budget-summary-${(data.clientName||'').replace(/\s+/g,'-')}.pdf`,image:{type:'jpeg',quality:.92},html2canvas:{scale:2,useCORS:true,logging:false},jsPDF:{unit:'mm',format:'letter',orientation:'portrait'}}).from(printRef.current).save();
        setSent(true);return;
      }
      await window.emailjs.send(EMAIL_CONFIG.serviceId,EMAIL_CONFIG.templateId,{
        to_email:email,customer:data.clientName,year:data.asOfDate,
        total_income:fmt(budgetTotalIncome),total_expenses:fmt(budgetTotalExpenses),net_income:fmt(net),
        pdf_attachment:pdfData,pdf_name:`budget-summary-${(data.clientName||'').replace(/\s+/g,'-')}.pdf`,
      },EMAIL_CONFIG.publicKey);
      setSent(true);
    }catch(e){setErr('Send failed: '+(e.text||e.message||String(e)));}
    finally{setSending(false);}
  };

  const cropRows=(data.budgetCrops||[]).filter(r=>r.crop||r.acres);
  const expRows=(data.budgetExpenses||[]).filter(r=>r.description||r.amount);

  if(sent)return React.createElement('div',{style:{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16}},
    React.createElement('div',{style:{background:'white',borderRadius:12,padding:40,textAlign:'center',maxWidth:380}},
      React.createElement('div',{style:{fontSize:52,marginBottom:12}},'✅'),
      React.createElement('div',{style:{fontWeight:800,fontSize:20,color:ISH,marginBottom:8}},'Budget Sent!'),
      React.createElement('p',{style:{color:'#6b7280',fontSize:14,marginBottom:20}},'The budget summary has been sent to ',React.createElement('strong',null,email)),
      React.createElement('button',{onClick:onClose,style:{background:ISH,color:'white',border:'none',borderRadius:6,padding:'9px 22px',fontWeight:700,cursor:'pointer'}},'Done')));

  return React.createElement('div',{style:{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16}},
    React.createElement('div',{style:{background:'white',borderRadius:12,padding:0,width:'min(640px,100%)',maxHeight:'90vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}},
      // Header
      React.createElement('div',{style:{background:ISH,padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}},
        React.createElement('span',{style:{color:'white',fontWeight:700,fontSize:16}},'📧 Share Budget with Customer'),
        React.createElement('button',{onClick:onClose,style:{background:'none',border:'none',color:'rgba(255,255,255,.7)',fontSize:20,cursor:'pointer',lineHeight:1}},'×')),
      // Email input
      React.createElement('div',{style:{padding:'16px 20px',borderBottom:'1px solid #e5e7eb'}},
        React.createElement('label',{style:{...ILBL,marginBottom:6}},'CUSTOMER EMAIL'),
        React.createElement('div',{style:{display:'flex',gap:8}},
          React.createElement('input',{type:'email',value:email,onChange:e=>setEmail(e.target.value),placeholder:'customer@email.com',onKeyDown:e=>e.key==='Enter'&&handleSend(),style:{flex:1,border:'1px solid #d1d5db',borderRadius:6,padding:'8px 12px',fontSize:14,fontFamily:'inherit',outline:'none'}}),
          React.createElement('button',{onClick:handleSend,disabled:sending,style:{background:IGOLD,color:'white',border:'none',borderRadius:6,padding:'8px 20px',fontWeight:700,fontSize:13,cursor:sending?'wait':'pointer',opacity:sending?.7:1,whiteSpace:'nowrap'}},sending?'Sending…':'Send PDF')),
        err&&React.createElement('div',{style:{color:'#991b1b',fontSize:12,marginTop:6}},err)),
      // Preview
      React.createElement('div',{style:{overflowY:'auto',flex:1,padding:20}},
        React.createElement('div',{style:{fontSize:11,color:'#9ca3af',marginBottom:12,textTransform:'uppercase',letterSpacing:1}},'Preview — what the customer receives'),
        React.createElement('div',{ref:printRef,style:{fontFamily:"'Source Sans 3',sans-serif",maxWidth:580,margin:'0 auto',border:'1px solid #e5e7eb',borderRadius:8,overflow:'hidden'}},
          // Customer-friendly header
          React.createElement('div',{style:{background:ISH,padding:'20px 24px',textAlign:'center'}},
            React.createElement('div',{style:{color:'white',fontSize:11,letterSpacing:3,marginBottom:4,opacity:.7}},'FIRST BANK OF MONTANA'),
            React.createElement('div',{style:{color:'white',fontWeight:800,fontSize:22,fontFamily:"'Playfair Display',serif"}},data.clientName||'Farm Operation'),
            React.createElement('div',{style:{color:'rgba(255,255,255,.75)',fontSize:13,marginTop:4}},'Agricultural Budget Summary — ',data.asOfDate||new Date().getFullYear())),
          // Summary cards
          React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',background:'#f8faf8',borderBottom:'1px solid #e5e7eb'}},
            [['Projected Revenue',budgetTotalIncome,'#15803d'],['Operating Costs',budgetTotalExpenses,'#b45309'],[net>=0?'Projected Net Income':'Projected Net Loss',Math.abs(net),net>=0?'#15803d':'#dc2626']].map(([l,v,c])=>React.createElement('div',{key:l,style:{padding:'16px 12px',textAlign:'center',borderRight:'1px solid #e5e7eb'}},React.createElement('div',{style:{fontSize:11,color:'#6b7280',marginBottom:4,letterSpacing:.3}}),React.createElement('div',{style:{fontSize:11,color:'#6b7280',marginBottom:4}}),React.createElement('div',{style:{fontSize:10,color:'#9ca3af',letterSpacing:.5,marginBottom:4,textTransform:'uppercase'}},l),React.createElement('div',{style:{fontSize:18,fontWeight:700,color:c}},fmt(v))))),
          // Crop plan
          cropRows.length>0&&React.createElement('div',{style:{padding:'16px 24px'}},
            React.createElement('div',{style:{fontWeight:700,fontSize:13,color:'#374151',borderBottom:'1px solid #e5e7eb',paddingBottom:6,marginBottom:10}},'🌱 Crop Plan'),
            React.createElement('table',{style:{width:'100%',borderCollapse:'collapse',fontSize:12.5}},
              React.createElement('thead',null,React.createElement('tr',{style:{background:'#f0fdf4'}},['Crop','Acres','Est. Yield','Price/Unit','Est. Revenue'].map(h=>React.createElement('th',{key:h,style:{padding:'5px 8px',textAlign:h==='Crop'?'left':'right',fontWeight:600,color:'#374151',fontSize:11}},h)))),
              React.createElement('tbody',null,cropRows.map((r,i)=>{
                const rev=(parseFloat(r.acres||0)*parseFloat(r.yieldPerAcre||0)*parseFloat(r.price||0)*(parseFloat(r.share||100)/100));
                return React.createElement('tr',{key:i,style:{borderBottom:'1px solid #f0f0f0'}},
                  React.createElement('td',{style:{padding:'5px 8px',fontWeight:500}},r.crop),
                  React.createElement('td',{style:{padding:'5px 8px',textAlign:'right'}},parseFloat(r.acres||0).toLocaleString()),
                  React.createElement('td',{style:{padding:'5px 8px',textAlign:'right'}},r.yieldPerAcre,' ',r.unit||'bu','/ac'),
                  React.createElement('td',{style:{padding:'5px 8px',textAlign:'right'}},'$',r.price,'/',r.unit||'bu'),
                  React.createElement('td',{style:{padding:'5px 8px',textAlign:'right',fontWeight:600,color:'#15803d'}},rev>0?fmt(rev):'—'));
              })))),
          // Expenses summary
          React.createElement('div',{style:{padding:'16px 24px',background:'#fafaf8'}},
            React.createElement('div',{style:{fontWeight:700,fontSize:13,color:'#374151',borderBottom:'1px solid #e5e7eb',paddingBottom:6,marginBottom:10}},'💰 Budget Summary'),
            [['Gross Revenue',budgetTotalIncome,'#15803d'],['Operating Expenses',budgetOperatingExpenses,'#92400e'],['Debt Service',budgetTotalDebtService,'#92400e'],['─────────────────','',''],['NET INCOME / LOSS',net,net>=0?'#15803d':'#dc2626']].map(([l,v,c],i)=>l==='─────────────────'?React.createElement('hr',{key:i,style:{border:'none',borderTop:'1px solid #e5e7eb',margin:'6px 0'}}):React.createElement('div',{key:l,style:{display:'flex',justifyContent:'space-between',padding:'3px 0',fontWeight:l==='NET INCOME / LOSS'?700:400,fontSize:l==='NET INCOME / LOSS'?14:13}},React.createElement('span',{style:{color:'#374151'}},l),React.createElement('span',{style:{color:c,fontWeight:l==='NET INCOME / LOSS'?700:500}},fmt(v)))),
          React.createElement('div',{style:{marginTop:16,padding:'10px 12px',background:'#f0fdf4',borderRadius:6,fontSize:11,color:'#6b7280',borderLeft:'3px solid #22c55e'}},
            'This budget summary is prepared by First Bank of Montana as a projection based on current plans and market prices. Actual results may vary.'))))));
}


// ── Customer-Facing Public Inspection Form ────────────────────────────────────
function CustomerInspectForm({ shareId }) {
  const [stage, setStage] = React.useState('pin'); // 'pin'|'form'|'done'|'error'
  const [pin, setPin] = React.useState('');
  const [pinErr, setPinErr] = React.useState('');
  const [inspData, setInspData] = React.useState(null);
  const [crops, setCrops] = React.useState([]);
  const [livestock, setLivestock] = React.useState([]);
  const [pastureCond, setPastureCond] = React.useState('');
  const [pastureCmt, setPastureCmt] = React.useState('');
  const [waterCond, setWaterCond] = React.useState('');
  const [waterCmt, setWaterCmt] = React.useState('');
  const [equipCond, setEquipCond] = React.useState('');
  const [equipCmt, setEquipCmt] = React.useState('');
  const [envCmt, setEnvCmt] = React.useState('');
  const [addlCmt, setAddlCmt] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState('');
  const SUPABASE_URL_PUB = (window.SUPABASE_URL || '').replace(/\/+$/, '');
  const SUPABASE_KEY_PUB = window.SUPABASE_ANON_KEY || '';

  const verifyPin = async () => {
    setPinErr('');
    try {
      const resp = await fetch(
        SUPABASE_URL_PUB + '/rest/v1/inspection_shares?share_id=eq.' + shareId + '&select=pin,insp_data,client_name,responded_at',
        { headers: { 'apikey': SUPABASE_KEY_PUB, 'Content-Type': 'application/json' } }
      );
      const rows = await resp.json();
      if (!rows.length) { setPinErr('Link not found or expired.'); return; }
      const row = rows[0];
      if (row.responded_at) { setStage('done'); return; }
      if (pin.trim() !== String(row.pin).trim()) { setPinErr('Incorrect PIN. Please check your email and try again.'); return; }
      const d = row.insp_data || {};
      setInspData(d);
      setCrops((d.inspCrops || []).map(r => ({...r, actualAcres: r.actualAcres||'', condition: r.condition||'', actualYield: r.actualYield||r.budgetedYield||'', location: r.location||'', deviationReason: r.deviationReason||''})));
      setLivestock((d.inspLivestock || []).map(r => ({...r, actualHead: r.actualHead||'', condition: r.condition||'', estWeight: r.estWeight||'', deviationReason: r.deviationReason||''})));
      setPastureCond(d.inspPastureCond||'');
      setPastureCmt(d.inspPastureCmt||'');
      setWaterCond(d.inspWaterCond||'');
      setWaterCmt(d.inspWaterCmt||'');
      setEquipCond(d.inspEquipCond||'');
      setEquipCmt(d.inspEquipCmt||'');
      setEnvCmt(d.inspEnvCmt||'');
      setAddlCmt(d.inspAddlCmt||'');
      setStage('form');
    } catch(e) { setPinErr('Connection error: ' + e.message); }
  };

  const submitResponse = async () => {
    setSubmitting(true); setErrMsg('');
    try {
      const response = {
        crops: crops.map(r => ({ actualAcres: r.actualAcres, condition: r.condition, actualYield: r.actualYield, location: r.location, deviationReason: r.deviationReason })),
        livestock: livestock.map(r => ({ actualHead: r.actualHead, condition: r.condition, estWeight: r.estWeight, deviationReason: r.deviationReason })),
        pastureCond, pastureCmt, waterCond, waterCmt, equipCond, equipCmt, envCmt, addlCmt,
        submittedAt: new Date().toISOString(),
      };
      const resp = await fetch(
        SUPABASE_URL_PUB + '/rest/v1/inspection_shares?share_id=eq.' + shareId,
        { method: 'PATCH',
          headers: { 'apikey': SUPABASE_KEY_PUB, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({ response, responded_at: new Date().toISOString() }) }
      );
      if (!resp.ok) throw new Error(await resp.text());
      setStage('done');
    } catch(e) { setErrMsg('Submission failed: ' + e.message); }
    setSubmitting(false);
  };

  const conds = ['Excellent','Good','Fair','Poor'];
  const condBtn = (val, set, opt) => {
    const active = val === opt;
    const cs = {Excellent:{c:'#15803d',bg:'#dcfce7',b:'#86efac'},Good:{c:'#1d4ed8',bg:'#dbeafe',b:'#93c5fd'},Fair:{c:'#92400e',bg:'#fef3c7',b:'#fcd34d'},Poor:{c:'#991b1b',bg:'#fee2e2',b:'#fca5a5'}}[opt]||{c:'#6b7280',bg:'#f3f4f6',b:'#d1d5db'};
    return React.createElement('button',{key:opt,type:'button',onClick:()=>set(active?'':opt),style:{padding:'3px 10px',borderRadius:999,fontSize:12,fontWeight:700,cursor:'pointer',border:`1.5px solid ${active?cs.b:'#e5e7eb'}`,background:active?cs.bg:'white',color:active?cs.c:'#9ca3af'}},opt);
  };

  const baseStyle = {fontFamily:"'Source Sans 3',system-ui,sans-serif",minHeight:'100vh',background:'#f9f5f5'};
  const card = {background:'white',borderRadius:12,padding:32,boxShadow:'0 4px 24px rgba(0,0,0,.1)',maxWidth:640,margin:'0 auto'};

  if (stage === 'done') return React.createElement('div',{style:{...baseStyle,display:'flex',alignItems:'center',justifyContent:'center',padding:24}},
    React.createElement('div',{style:{...card,textAlign:'center'}},
      React.createElement('div',{style:{fontSize:56,marginBottom:12}},'✅'),
      React.createElement('div',{style:{fontWeight:800,fontSize:22,color:'#1B4332',marginBottom:8}},'Form Submitted!'),
      React.createElement('p',{style:{color:'#6b7280',fontSize:14,lineHeight:1.6}},'Your inspection information has been received. Your lender will review your responses.')));

  if (stage === 'error') return React.createElement('div',{style:{...baseStyle,display:'flex',alignItems:'center',justifyContent:'center',padding:24}},
    React.createElement('div',{style:{...card,textAlign:'center'}},
      React.createElement('div',{style:{fontSize:48,marginBottom:12}},'⚠️'),
      React.createElement('div',{style:{fontWeight:700,fontSize:18,color:'#991b1b',marginBottom:8}},'Link Not Found'),
      React.createElement('p',{style:{color:'#6b7280',fontSize:14}},'This inspection link may have expired or is invalid. Please contact your lender.')));

  if (stage === 'pin') return React.createElement('div',{style:{...baseStyle,display:'flex',alignItems:'center',justifyContent:'center',padding:24}},
    React.createElement('div',{style:card},
      React.createElement('div',{style:{textAlign:'center',marginBottom:28}},
        React.createElement('div',{style:{fontSize:32,marginBottom:8}},'🌾'),
        React.createElement('div',{style:{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:20,color:'#6B0E1E'}},'First Bank of Montana'),
        React.createElement('div',{style:{fontSize:13,color:'#888',marginTop:4}},'Agricultural Inspection Form')),
      React.createElement('p',{style:{fontSize:14,color:'#555',marginBottom:20,lineHeight:1.6}},'Your lender has sent you a crop inspection form to fill out. Enter your 6-digit PIN to get started.'),
      React.createElement('label',{style:{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:6,letterSpacing:.3}},'ENTER YOUR 6-DIGIT PIN'),
      React.createElement('input',{type:'tel',inputMode:'numeric',pattern:'[0-9]*',maxLength:6,value:pin,onChange:e=>setPin(e.target.value.replace(/\D/g,'')),onKeyDown:e=>e.key==='Enter'&&verifyPin(),placeholder:'000000',style:{width:'100%',border:`1.5px solid ${pinErr?'#fca5a5':'#d1d5db'}`,borderRadius:8,padding:'12px 16px',fontSize:24,fontFamily:'monospace',textAlign:'center',letterSpacing:8,outline:'none',boxSizing:'border-box',marginBottom:pinErr?8:16}}),
      pinErr&&React.createElement('div',{style:{color:'#991b1b',fontSize:13,marginBottom:14,padding:'8px 12px',background:'#fef2f2',borderRadius:6,border:'1px solid #fca5a5'}},pinErr),
      React.createElement('button',{onClick:verifyPin,style:{width:'100%',background:'#6B0E1E',color:'white',border:'none',borderRadius:8,padding:12,fontWeight:700,fontSize:16,cursor:'pointer',fontFamily:'inherit'}},'Open My Form →')));

  // Form stage
  if (stage === 'form') return React.createElement('div',{style:baseStyle},
    React.createElement('div',{style:{background:'#6B0E1E',padding:'14px 20px',display:'flex',alignItems:'center',gap:12}},
      React.createElement('span',{style:{fontSize:22}},'🌾'),
      React.createElement('div',null,
        React.createElement('div',{style:{color:'white',fontWeight:700,fontSize:16}},'First Bank of Montana — Crop Inspection'),
        React.createElement('div',{style:{color:'rgba(255,255,255,.65)',fontSize:12}},inspData?.clientName||''))),
    React.createElement('div',{style:{maxWidth:700,margin:'0 auto',padding:'24px 16px'}},
      errMsg&&React.createElement('div',{style:{background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:6,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#991b1b'}},'⚠️ '+errMsg),
      // Instruction box
      React.createElement('div',{style:{background:'#f0f6ff',border:'1px solid #c0d8f0',borderRadius:10,padding:16,marginBottom:24}},
        React.createElement('div',{style:{fontWeight:700,color:'#2d5a8e',marginBottom:4,fontSize:14}},'📋 Instructions'),
        React.createElement('div',{style:{fontSize:13,color:'#555',lineHeight:1.6}},'Your lender has pre-filled the budgeted (planned) values below. Please fill in the actual amounts for what was planted or harvested this season. Grey fields are pre-filled by your lender — just fill in the white fields.')),
      // Crops
      crops.length > 0 && React.createElement('div',{style:{background:'white',borderRadius:10,border:'1px solid #d1fae5',marginBottom:20,overflow:'hidden'}},
        React.createElement('div',{style:{background:'#1B4332',padding:'10px 16px'}},React.createElement('span',{style:{color:'white',fontWeight:700,fontSize:15}},'🌱 Crops')),
        React.createElement('div',{style:{padding:16,display:'flex',flexDirection:'column',gap:16}},
          crops.map((r,i)=>React.createElement('div',{key:i,style:{border:'1px solid #e5e7eb',borderRadius:8,padding:14,background:'#fafafa'}},
            React.createElement('div',{style:{fontWeight:700,fontSize:15,color:'#1a1a1a',marginBottom:10}},r.budgetedCrop||'Crop '+(i+1)),
            React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}},
              React.createElement('div',null,
                React.createElement('label',{style:{fontSize:11,fontWeight:600,color:'#888',display:'block',marginBottom:3,textTransform:'uppercase',letterSpacing:.3}},'Budgeted Acres (planned)'),
                React.createElement('div',{style:{background:'#f5f5f5',border:'1px solid #e5e7eb',borderRadius:6,padding:'8px 12px',fontSize:14,color:'#6b7280',fontWeight:600}},r.budgetedAcres||'—')),
              React.createElement('div',null,
                React.createElement('label',{style:{fontSize:11,fontWeight:600,color:'#374151',display:'block',marginBottom:3,textTransform:'uppercase',letterSpacing:.3}},'✏️ Actual Acres Planted'),
                React.createElement('input',{type:'number',value:r.actualAcres,onChange:e=>setCrops(cs=>cs.map((c,j)=>j===i?{...c,actualAcres:e.target.value}:c)),placeholder:r.budgetedAcres||'0',style:{border:'1.5px solid #6B0E1E',borderRadius:6,padding:'8px 12px',fontSize:14,width:'100%',fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}))),
            React.createElement('div',{style:{marginBottom:10}},
              React.createElement('label',{style:{fontSize:11,fontWeight:600,color:'#374151',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:.3}},'✏️ Crop Condition'),
              React.createElement('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},conds.map(o=>condBtn(r.condition,v=>setCrops(cs=>cs.map((c,j)=>j===i?{...c,condition:v}:c)),o)))),
            React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}},
              React.createElement('div',null,
                React.createElement('label',{style:{fontSize:11,fontWeight:600,color:'#374151',display:'block',marginBottom:3,textTransform:'uppercase',letterSpacing:.3}},'✏️ Actual Yield / Acre'),
                React.createElement('input',{type:'number',value:r.actualYield,onChange:e=>setCrops(cs=>cs.map((c,j)=>j===i?{...c,actualYield:e.target.value}:c)),placeholder:r.budgetedYield||'0',style:{border:'1.5px solid #6B0E1E',borderRadius:6,padding:'8px 12px',fontSize:14,width:'100%',fontFamily:'inherit',outline:'none',boxSizing:'border-box'}})),
              React.createElement('div',null,
                React.createElement('label',{style:{fontSize:11,fontWeight:600,color:'#374151',display:'block',marginBottom:3,textTransform:'uppercase',letterSpacing:.3}},'✏️ Field / Section'),
                React.createElement('input',{type:'text',value:r.location,onChange:e=>setCrops(cs=>cs.map((c,j)=>j===i?{...c,location:e.target.value}:c)),placeholder:'e.g. NW Section 14',style:{border:'1.5px solid #6B0E1E',borderRadius:6,padding:'8px 12px',fontSize:14,width:'100%',fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}))),
            React.createElement('div',null,
              React.createElement('label',{style:{fontSize:11,fontWeight:600,color:'#374151',display:'block',marginBottom:3,textTransform:'uppercase',letterSpacing:.3}},'✏️ Notes (if different from plan)'),
              React.createElement('textarea',{value:r.deviationReason,onChange:e=>setCrops(cs=>cs.map((c,j)=>j===i?{...c,deviationReason:e.target.value}:c)),placeholder:'e.g. wet spring, replanted 50 acres to barley...',rows:2,style:{border:'1px solid #d1d5db',borderRadius:6,padding:'8px 12px',fontSize:13,width:'100%',fontFamily:'inherit',outline:'none',resize:'vertical',boxSizing:'border-box'}})))))),
      // Conditions
      React.createElement('div',{style:{background:'white',borderRadius:10,border:'1px solid #d1fae5',marginBottom:20,overflow:'hidden'}},
        React.createElement('div',{style:{background:'#1B4332',padding:'10px 16px'}},React.createElement('span',{style:{color:'white',fontWeight:700,fontSize:15}},'🌿 Field & Ranch Conditions')),
        React.createElement('div',{style:{padding:16,display:'flex',flexDirection:'column',gap:16}},
          [['🟤 Pasture',pastureCond,setPastureCond,pastureCmt,setPastureCmt,['Excellent','Good','Fair','Poor']],
           ['💧 Water / Irrigation',waterCond,setWaterCond,waterCmt,setWaterCmt,['Excess','Adequate','Limited']],
           ['🚜 Equipment',equipCond,setEquipCond,equipCmt,setEquipCmt,['Excellent','Good','Fair','Poor']]].map(([label,cval,cset,tval,tset,opts])=>
            React.createElement('div',{key:label},
              React.createElement('div',{style:{fontWeight:600,fontSize:14,marginBottom:8,color:'#374151'}},label),
              React.createElement('div',{style:{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}},opts.map(o=>condBtn(cval,cset,o))),
              React.createElement('textarea',{value:tval,onChange:e=>tset(e.target.value),placeholder:'Comments...',rows:2,style:{border:'1px solid #d1d5db',borderRadius:6,padding:'8px 12px',fontSize:13,width:'100%',fontFamily:'inherit',outline:'none',resize:'vertical',boxSizing:'border-box'}}))))),
      React.createElement('div',{style:{background:'white',borderRadius:10,border:'1px solid #d1fae5',marginBottom:24,overflow:'hidden'}},
        React.createElement('div',{style:{background:'#1B4332',padding:'10px 16px'}},React.createElement('span',{style:{color:'white',fontWeight:700,fontSize:15}},'📋 Additional Comments')),
        React.createElement('div',{style:{padding:16}},
          React.createElement('textarea',{value:addlCmt,onChange:e=>setAddlCmt(e.target.value),placeholder:'Any other information your lender should know...',rows:4,style:{border:'1px solid #d1d5db',borderRadius:6,padding:'8px 12px',fontSize:13,width:'100%',fontFamily:'inherit',outline:'none',resize:'vertical',boxSizing:'border-box'}}))),
      React.createElement('button',{onClick:submitResponse,disabled:submitting,style:{width:'100%',background:'#1B4332',color:'white',border:'none',borderRadius:10,padding:16,fontWeight:700,fontSize:17,cursor:submitting?'wait':'pointer',opacity:submitting?.7:1,boxShadow:'0 4px 16px rgba(27,67,50,.3)',fontFamily:'inherit'}},submitting?'⏳ Submitting…':'✅ Submit My Inspection'),
      React.createElement('div',{style:{textAlign:'center',fontSize:11,color:'#9ca3af',marginTop:12}},'Your response is sent securely to First Bank of Montana.')));

  return null;
}


// ── Shared customer form helpers ─────────────────────────────────────────────
const CUST_SUPABASE_URL = () => (window.SUPABASE_URL||'').replace(/\/+$/,'');
const CUST_ANON_KEY = () => window.SUPABASE_ANON_KEY||'';
const custHeaders = () => ({'Content-Type':'application/json','apikey':CUST_ANON_KEY()});

async function notifySubmission(type, clientName, shareId) {
  try {
    await fetch('/.netlify/functions/notify-submission', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({type, clientName, shareId, submittedAt:new Date().toISOString()}),
    });
  } catch {}
}

function CustSec({title,children,open,onToggle}) {
  return (
    <div style={{marginBottom:12,border:'1px solid #e5e7eb',borderRadius:8,overflow:'hidden'}}>
      <div onClick={onToggle} style={{background:'#f5e8ea',padding:'10px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer',userSelect:'none'}}>
        <span style={{fontWeight:700,fontSize:14,color:'#6B0E1E'}}>{title}</span>
        <span style={{color:'#6B0E1E',fontSize:12}}>{open?'▲':'▼'}</span>
      </div>
      {open && <div style={{padding:14,background:'white'}}>{children}</div>}
    </div>
  );
}

function CustInp({value,onChange,placeholder,type='text',prefix,style={}}) {
  return (
    <div style={{display:'flex',alignItems:'center',border:'1px solid #d1d5db',borderRadius:6,overflow:'hidden',background:'white',...style}}>
      {prefix&&<span style={{padding:'8px 10px',background:'#f9f5f5',borderRight:'1px solid #d1d5db',color:'#666',fontSize:13,whiteSpace:'nowrap'}}>{prefix}</span>}
      <input type={type} value={value||''} placeholder={placeholder||''}
        onChange={e=>onChange(type==='number'?e.target.value.replace(/[^0-9.]/g,''):e.target.value)}
        style={{flex:1,border:'none',padding:'8px 10px',fontSize:14,fontFamily:'inherit',outline:'none',background:'transparent'}}/>
    </div>
  );
}

// ── Customer Balance Sheet Form ───────────────────────────────────────────────
function CustomerBalanceSheetForm({shareId}) {
  const [stage,setStage]=React.useState('pin');
  const [pin,setPin]=React.useState(''); const [pinErr,setPinErr]=React.useState('');
  const [shareRow,setShareRow]=React.useState(null);
  const [data,setData]=React.useState(null);
  const [saving,setSaving]=React.useState(false);
  const [submitting,setSubmitting]=React.useState(false);
  const [open,setOpen]=React.useState({cash:true,farmProducts:true,livestock:true,cropInv:true,breeding:false,re:true,vehicles:false,machinery:false,otherA:false,opNotes:true,termDebt:true,reMort:false,otherL:false});
  const toggle = k => setOpen(o=>({...o,[k]:!o[k]}));
  const n = v => Number((v||'').toString().replace(/[^0-9.-]/g,''))||0;
  const fmt = v => v===''||v===null||v===undefined?'$0':'$'+Number(v||0).toLocaleString('en-US',{maximumFractionDigits:0});
  const saveTimer = React.useRef(null);

  const verifyPin = async () => {
    setPinErr('');
    try {
      const resp = await fetch(CUST_SUPABASE_URL()+'/rest/v1/balance_sheet_shares?share_id=eq.'+shareId+'&select=*',{headers:custHeaders()});
      const rows = await resp.json();
      if(!rows.length){setPinErr('Link not found or expired.');return;}
      const row = rows[0];
      if(new Date(row.expires_at)<new Date()){setStage('expired');return;}
      if(row.status==='reviewed'){setStage('reviewed');return;}
      if(String(row.pin).trim()!==pin.trim()){setPinErr('Incorrect PIN. Please check your email.');return;}
      setShareRow(row);
      const d = row.customer_draft || row.original_data || {};
      setData({...d});
      setStage('form');
    } catch(e){setPinErr('Connection error: '+e.message);}
  };

  const saveDraft = React.useCallback(async (d) => {
    if(!shareRow||!d)return;
    setSaving(true);
    try {
      await fetch(CUST_SUPABASE_URL()+'/rest/v1/balance_sheet_shares?share_id=eq.'+shareId,{
        method:'PATCH',headers:{...custHeaders(),'Prefer':'return=minimal'},
        body:JSON.stringify({customer_draft:d}),
      });
    } catch {}
    setSaving(false);
  },[shareRow,shareId]);

  const updateData = (updates) => {
    setData(d=>{
      const nd={...d,...updates};
      clearTimeout(saveTimer.current);
      saveTimer.current=setTimeout(()=>saveDraft(nd),1500);
      return nd;
    });
  };
  const setArr = (k,i,f,v) => updateData({[k]:data[k].map((r,j)=>j===i?{...r,[f]:v}:r)});
  const addRow = (k,tpl) => updateData({[k]:[...(data[k]||[]),{...tpl}]});
  const remRow = (k,i) => updateData({[k]:(data[k]||[]).filter((_,j)=>j!==i)});

  const submit = async () => {
    setSubmitting(true);
    try {
      await fetch(CUST_SUPABASE_URL()+'/rest/v1/balance_sheet_shares?share_id=eq.'+shareId,{
        method:'PATCH',headers:{...custHeaders(),'Prefer':'return=minimal'},
        body:JSON.stringify({customer_draft:data,status:'submitted',submitted_at:new Date().toISOString()}),
      });
      await notifySubmission('balance_sheet',shareRow?.client_name||'',shareId);
      setStage('done');
    } catch(e){alert('Submit failed: '+e.message);}
    setSubmitting(false);
  };

  const pageStyle={fontFamily:"'Source Sans 3',system-ui,sans-serif",minHeight:'100vh',background:'#f9f5f5'};
  const cardStyle={background:'white',borderRadius:12,padding:32,maxWidth:600,margin:'0 auto'};

  if(stage==='expired') return <div style={{...pageStyle,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}><div style={{...cardStyle,textAlign:'center'}}><div style={{fontSize:48,marginBottom:12}}>⏰</div><div style={{fontWeight:700,fontSize:18,color:'#991b1b',marginBottom:8}}>Link Expired</div><p style={{color:'#6b7280',fontSize:14}}>This balance sheet link has expired. Please contact your lender for a new link.</p></div></div>;
  if(stage==='reviewed') return <div style={{...pageStyle,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}><div style={{...cardStyle,textAlign:'center'}}><div style={{fontSize:48,marginBottom:12}}>✅</div><div style={{fontWeight:700,fontSize:18,color:'#15803d',marginBottom:8}}>Already Submitted</div><p style={{color:'#6b7280',fontSize:14}}>Your balance sheet has been received and reviewed by your lender. Thank you!</p></div></div>;
  if(stage==='done') return <div style={{...pageStyle,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}><div style={{...cardStyle,textAlign:'center'}}><div style={{fontSize:56,marginBottom:12}}>✅</div><div style={{fontWeight:800,fontSize:22,color:'#15803d',marginBottom:8}}>Balance Sheet Submitted!</div><p style={{color:'#6b7280',fontSize:14,lineHeight:1.6}}>Your balance sheet has been sent to First Bank of Montana for review. Your lender will be in touch.</p></div></div>;

  if(stage==='pin') return (
    <div style={{...pageStyle,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={cardStyle}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:32,marginBottom:8}}>🏦</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:20,color:'#6B0E1E'}}>First Bank of Montana</div>
          <div style={{fontSize:13,color:'#888',marginTop:4}}>Customer Balance Sheet Portal</div>
        </div>
        <p style={{fontSize:14,color:'#555',marginBottom:20,lineHeight:1.6}}>Your lender has shared a balance sheet with you to review and fill out. Enter your 6-digit PIN to get started. Your progress saves automatically so you can come back anytime before the link expires.</p>
        <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:6,letterSpacing:.3}}>ENTER YOUR 6-DIGIT PIN</label>
        <input type="tel" inputMode="numeric" maxLength={6} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))} onKeyDown={e=>e.key==='Enter'&&verifyPin()} placeholder="000000"
          style={{width:'100%',border:`1.5px solid ${pinErr?'#fca5a5':'#d1d5db'}`,borderRadius:8,padding:'12px 16px',fontSize:24,fontFamily:'monospace',textAlign:'center',letterSpacing:8,outline:'none',boxSizing:'border-box',marginBottom:pinErr?8:16}}/>
        {pinErr&&<div style={{color:'#991b1b',fontSize:13,marginBottom:14,padding:'8px 12px',background:'#fef2f2',borderRadius:6,border:'1px solid #fca5a5'}}>{pinErr}</div>}
        <button onClick={verifyPin} style={{width:'100%',background:'#6B0E1E',color:'white',border:'none',borderRadius:8,padding:12,fontWeight:700,fontSize:16,cursor:'pointer',fontFamily:'inherit'}}>Open My Balance Sheet →</button>
      </div>
    </div>
  );

  if(!data) return <div style={{...pageStyle,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{color:'#888'}}>Loading...</div></div>;

  // Totals
  const cashTot = n(data.cashGlacier)+(data.cashOther||[]).reduce((s,r)=>s+n(r.amount),0);
  const farmProdTot = (data.farmProducts||[]).reduce((s,r)=>s+n(r.quantity)*n(r.pricePerUnit)*(n(r.share||100)/100),0);
  const lsMktTot = (data.livestockMarket||[]).reduce((s,r)=>s+n(r.value),0);
  const cropInvTot = (data.cropInvestment||[]).reduce((s,r)=>s+n(r.acres)*n(r.valuePerAcre),0);
  const breedTot = (data.breedingStock||[]).reduce((s,r)=>s+n(r.value),0);
  const reTot = (data.realEstate||[]).reduce((s,r)=>s+n(r.acres)*n(r.valuePerAcre),0);
  const vehTot = (data.vehicles||[]).reduce((s,r)=>s+n(r.value),0);
  const machTot = (data.machinery||[]).reduce((s,r)=>s+n(r.value),0);
  const otherATot = (data.otherAssets||[]).reduce((s,r)=>s+n(r.amount),0);
  const fedPay = Array.isArray(data.federalPayments)?(data.federalPayments||[]).reduce((s,r)=>s+n(r.amount),0):n(data.federalPayments);
  const supTot = (data.supplies||[]).reduce((s,r)=>s+n(r.value),0);
  const otherCurTot = (data.otherCurrent||[]).reduce((s,r)=>s+n(r.amount),0);
  const totalAssets = cashTot+farmProdTot+lsMktTot+cropInvTot+fedPay+supTot+otherCurTot+breedTot+reTot+vehTot+machTot+otherATot;
  const opNotesTot = (data.operatingNotes||[]).reduce((s,r)=>s+n(r.balance),0);
  const termTot = (data.intermediatDebt||[]).reduce((s,r)=>s+n(r.annualPmt),0);
  const reMortTot = (data.reMortgages||[]).reduce((s,r)=>s+n(r.principal),0);
  const otherLTot = (data.otherLiabilities||[]).reduce((s,r)=>s+n(r.balance),0);
  const taxTot = n(data.taxesDue);
  const totalLiab = opNotesTot+termTot+reMortTot+otherLTot+taxTot;
  const netWorth = totalAssets-totalLiab;

  const rowStyle={display:'flex',gap:8,alignItems:'center',marginBottom:8,padding:'8px 10px',background:'#f9f5f5',borderRadius:6};
  const remBtn=(k,i)=><button type="button" onClick={()=>remRow(k,i)} style={{background:'#fee2e2',color:'#b91c1c',border:'none',borderRadius:4,padding:'2px 8px',cursor:'pointer',fontSize:14,flexShrink:0}}>×</button>;
  const addBtn=(k,tpl,label)=><button type="button" onClick={()=>addRow(k,tpl)} style={{marginTop:6,background:'#f5e8ea',color:'#6B0E1E',border:'1.5px dashed #6B0E1E',borderRadius:5,padding:'5px 14px',cursor:'pointer',fontSize:13,fontWeight:600}}>+ {label}</button>;
  const lbl=(text)=><div style={{fontSize:11,fontWeight:600,color:'#888',textTransform:'uppercase',letterSpacing:.3,marginBottom:3}}>{text}</div>;

  return (
    <div style={pageStyle}>
      {/* Top bar */}
      <div style={{background:'#6B0E1E',padding:'12px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:99,boxShadow:'0 2px 8px rgba(0,0,0,.3)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:20}}>🏦</span>
          <div>
            <div style={{color:'white',fontWeight:700,fontSize:15}}>First Bank of Montana</div>
            <div style={{color:'rgba(255,255,255,.6)',fontSize:11}}>{shareRow?.client_name||''} — Balance Sheet</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {saving&&<span style={{color:'rgba(255,255,255,.6)',fontSize:12}}>Saving...</span>}
          <button onClick={()=>saveDraft(data)} style={{background:'rgba(255,255,255,.15)',color:'white',border:'1px solid rgba(255,255,255,.3)',borderRadius:5,padding:'6px 14px',cursor:'pointer',fontSize:12,fontWeight:600}}>💾 Save Draft</button>
        </div>
      </div>
      <div style={{maxWidth:700,margin:'0 auto',padding:'20px 16px 80px'}}>
        <div style={{background:'#f0f6ff',border:'1px solid #c0d8f0',borderRadius:10,padding:14,marginBottom:20}}>
          <div style={{fontWeight:700,color:'#2d5a8e',marginBottom:4,fontSize:14}}>📋 Instructions</div>
          <div style={{fontSize:13,color:'#555',lineHeight:1.6}}>Your lender has pre-filled this form with existing information. Please review each section, correct any figures, and add anything that's missing. Your progress saves automatically. When you're done, scroll to the bottom and click Submit.</div>
        </div>

        {/* ASSETS */}
        <div style={{background:'#6B0E1E',color:'white',fontWeight:700,fontSize:14,padding:'8px 14px',borderRadius:'8px 8px 0 0',letterSpacing:.5,textTransform:'uppercase'}}>Assets</div>

        <CustSec title="Cash & Bank Accounts" open={open.cash} onToggle={()=>toggle('cash')}>
          {lbl('Glacier Bank / FBMT Balance')}
          <CustInp prefix="$" value={data.cashGlacier} onChange={v=>updateData({cashGlacier:v})} placeholder="0"/>
          <div style={{marginTop:10}}>{lbl('Other Banks / Institutions')}</div>
          {(data.cashOther||[]).map((r,i)=><div key={i} style={rowStyle}><CustInp value={r.institution} onChange={v=>setArr('cashOther',i,'institution',v)} placeholder="Bank name" style={{flex:2}}/><CustInp prefix="$" value={r.amount} onChange={v=>setArr('cashOther',i,'amount',v)} placeholder="0" style={{flex:1}}/>{remBtn('cashOther',i)}</div>)}
          {addBtn('cashOther',{institution:'',amount:''},'Add Bank')}
          <div style={{marginTop:8,fontWeight:600,color:'#6B0E1E',fontSize:13}}>Total Cash: {fmt(cashTot)}</div>
        </CustSec>

        <CustSec title="Farm Products on Hand" open={open.farmProducts} onToggle={()=>toggle('farmProducts')}>
          {(data.farmProducts||[]).map((r,i)=><div key={i} style={{...rowStyle,flexWrap:'wrap'}}>
            <CustInp value={r.kind} onChange={v=>setArr('farmProducts',i,'kind',v)} placeholder="e.g. Wheat, Barley" style={{flex:'1 1 120px'}}/>
            <CustInp value={r.quantity} onChange={v=>setArr('farmProducts',i,'quantity',v)} placeholder="Qty" type="number" style={{flex:'1 1 60px'}}/>
            <select value={r.unit||'bu'} onChange={e=>setArr('farmProducts',i,'unit',e.target.value)} style={{border:'1px solid #d1d5db',borderRadius:6,padding:'8px 6px',fontSize:13,background:'white',outline:'none'}}>
              {['bu','ton','lbs','cwt','bale'].map(u=><option key={u}>{u}</option>)}
            </select>
            <CustInp prefix="$" value={r.pricePerUnit} onChange={v=>setArr('farmProducts',i,'pricePerUnit',v)} placeholder="Price/unit" type="number" style={{flex:'1 1 80px'}}/>
            {remBtn('farmProducts',i)}
          </div>)}
          {addBtn('farmProducts',{quantity:'',unit:'bu',kind:'',pricePerUnit:'',share:'100',contracted:false},'Add Crop')}
          <div style={{marginTop:8,fontWeight:600,color:'#6B0E1E',fontSize:13}}>Total: {fmt(farmProdTot)}</div>
        </CustSec>

        <CustSec title="Market Livestock" open={open.livestock} onToggle={()=>toggle('livestock')}>
          {(data.livestockMarket||[]).map((r,i)=><div key={i} style={rowStyle}><CustInp value={r.number} onChange={v=>setArr('livestockMarket',i,'number',v)} placeholder="# head" style={{width:80,flex:'none'}}/><CustInp value={r.kind} onChange={v=>setArr('livestockMarket',i,'kind',v)} placeholder="Kind / weight" style={{flex:2}}/><CustInp prefix="$" value={r.value} onChange={v=>setArr('livestockMarket',i,'value',v)} placeholder="Total value" style={{flex:1}}/>{remBtn('livestockMarket',i)}</div>)}
          {addBtn('livestockMarket',{number:'',kind:'',value:''},'Add Livestock')}
          <div style={{marginTop:8,fontWeight:600,color:'#6B0E1E',fontSize:13}}>Total: {fmt(lsMktTot)}</div>
        </CustSec>

        <CustSec title="Growing Crops (Input Costs)" open={open.cropInv} onToggle={()=>toggle('cropInv')}>
          {(data.cropInvestment||[]).map((r,i)=><div key={i} style={rowStyle}><CustInp value={r.cropType} onChange={v=>setArr('cropInvestment',i,'cropType',v)} placeholder="Crop type" style={{flex:2}}/><CustInp value={r.acres} onChange={v=>setArr('cropInvestment',i,'acres',v)} placeholder="Acres" type="number" style={{flex:1}}/><CustInp prefix="$" value={r.valuePerAcre} onChange={v=>setArr('cropInvestment',i,'valuePerAcre',v)} placeholder="$/acre" style={{flex:1}}/>{remBtn('cropInvestment',i)}</div>)}
          {addBtn('cropInvestment',{cropType:'',acres:'',valuePerAcre:''},'Add Crop')}
          <div style={{marginTop:8,fontWeight:600,color:'#6B0E1E',fontSize:13}}>Total: {fmt(cropInvTot)}</div>
        </CustSec>

        <CustSec title="Breeding Stock" open={open.breeding} onToggle={()=>toggle('breeding')}>
          {(data.breedingStock||[]).map((r,i)=><div key={i} style={rowStyle}><CustInp value={r.number} onChange={v=>setArr('breedingStock',i,'number',v)} placeholder="# head" style={{width:80,flex:'none'}}/><CustInp value={r.kind} onChange={v=>setArr('breedingStock',i,'kind',v)} placeholder="Kind" style={{flex:2}}/><CustInp prefix="$" value={r.value} onChange={v=>setArr('breedingStock',i,'value',v)} placeholder="Total value" style={{flex:1}}/>{remBtn('breedingStock',i)}</div>)}
          {addBtn('breedingStock',{number:'',kind:'',value:''},'Add Breeding Stock')}
          <div style={{marginTop:8,fontWeight:600,color:'#6B0E1E',fontSize:13}}>Total: {fmt(breedTot)}</div>
        </CustSec>

        <CustSec title="Real Estate" open={open.re} onToggle={()=>toggle('re')}>
          {(data.realEstate||[]).map((r,i)=><div key={i} style={{...rowStyle,flexWrap:'wrap'}}>
            <CustInp value={r.acres} onChange={v=>setArr('realEstate',i,'acres',v)} placeholder="Acres" type="number" style={{flex:'1 1 70px'}}/>
            <CustInp value={r.description||r.reType} onChange={v=>setArr('realEstate',i,'description',v)} placeholder="Description / section" style={{flex:'2 1 140px'}}/>
            <CustInp prefix="$" value={r.valuePerAcre} onChange={v=>setArr('realEstate',i,'valuePerAcre',v)} placeholder="$/acre" style={{flex:'1 1 80px'}}/>
            <div style={{fontSize:12,color:'#6B0E1E',fontWeight:600,alignSelf:'center',whiteSpace:'nowrap'}}>{fmt(n(r.acres)*n(r.valuePerAcre))}</div>
            {remBtn('realEstate',i)}
          </div>)}
          {addBtn('realEstate',{acres:'',reType:'',description:'',valuePerAcre:''},'Add Tract')}
          <div style={{marginTop:8,fontWeight:600,color:'#6B0E1E',fontSize:13}}>Total: {fmt(reTot)}</div>
        </CustSec>

        <CustSec title="Titled Vehicles" open={open.vehicles} onToggle={()=>toggle('vehicles')}>
          {(data.vehicles||[]).map((r,i)=><div key={i} style={rowStyle}><CustInp value={r.year} onChange={v=>setArr('vehicles',i,'year',v)} placeholder="Year" style={{width:70,flex:'none'}}/><CustInp value={r.make} onChange={v=>setArr('vehicles',i,'make',v)} placeholder="Make / Model" style={{flex:2}}/><CustInp prefix="$" value={r.value} onChange={v=>setArr('vehicles',i,'value',v)} placeholder="Value" style={{flex:1}}/>{remBtn('vehicles',i)}</div>)}
          {addBtn('vehicles',{year:'',make:'',vin:'',condition:'',value:''},'Add Vehicle')}
          <div style={{marginTop:8,fontWeight:600,color:'#6B0E1E',fontSize:13}}>Total: {fmt(vehTot)}</div>
        </CustSec>

        <CustSec title="Machinery & Equipment" open={open.machinery} onToggle={()=>toggle('machinery')}>
          {(data.machinery||[]).map((r,i)=><div key={i} style={{...rowStyle,flexWrap:'wrap'}}>
            <CustInp value={r.year} onChange={v=>setArr('machinery',i,'year',v)} placeholder="Year" style={{width:70,flex:'none'}}/>
            <CustInp value={r.make} onChange={v=>setArr('machinery',i,'make',v)} placeholder="Make / Model" style={{flex:2}}/>
            <CustInp prefix="$" value={r.value} onChange={v=>setArr('machinery',i,'value',v)} placeholder="Value" style={{flex:1}}/>
            {remBtn('machinery',i)}
          </div>)}
          {addBtn('machinery',{year:'',make:'',size:'',serial:'',condition:'',value:''},'Add Equipment')}
          <div style={{marginTop:8,fontWeight:600,color:'#6B0E1E',fontSize:13}}>Total: {fmt(machTot)}</div>
        </CustSec>

        <CustSec title="Other Assets" open={open.otherA} onToggle={()=>toggle('otherA')}>
          {(data.otherAssets||[]).map((r,i)=><div key={i} style={rowStyle}><CustInp value={r.description} onChange={v=>setArr('otherAssets',i,'description',v)} placeholder="Description" style={{flex:2}}/><CustInp prefix="$" value={r.amount} onChange={v=>setArr('otherAssets',i,'amount',v)} placeholder="Value" style={{flex:1}}/>{remBtn('otherAssets',i)}</div>)}
          {addBtn('otherAssets',{description:'',amount:''},'Add Asset')}
          <div style={{marginTop:8,fontWeight:600,color:'#6B0E1E',fontSize:13}}>Total: {fmt(otherATot)}</div>
        </CustSec>

        <div style={{background:'#1a5c25',color:'white',fontWeight:700,padding:'10px 16px',borderRadius:6,marginBottom:16,display:'flex',justifyContent:'space-between'}}>
          <span>TOTAL ASSETS</span><span>{fmt(totalAssets)}</span>
        </div>

        {/* LIABILITIES */}
        <div style={{background:'#4a0810',color:'white',fontWeight:700,fontSize:14,padding:'8px 14px',borderRadius:'8px 8px 0 0',letterSpacing:.5,textTransform:'uppercase',marginTop:8}}>Liabilities</div>

        <CustSec title="Operating Notes & Lines of Credit" open={open.opNotes} onToggle={()=>toggle('opNotes')}>
          {(data.operatingNotes||[]).map((r,i)=><div key={i} style={{...rowStyle,flexWrap:'wrap'}}>
            <CustInp value={r.creditor} onChange={v=>setArr('operatingNotes',i,'creditor',v)} placeholder="Lender" style={{flex:'2 1 120px'}}/>
            <CustInp prefix="$" value={r.balance} onChange={v=>setArr('operatingNotes',i,'balance',v)} placeholder="Balance" style={{flex:'1 1 80px'}}/>
            {remBtn('operatingNotes',i)}
          </div>)}
          {addBtn('operatingNotes',{creditor:'',dueDate:'',pmt:'',balance:'',security:''},'Add Note')}
          <div style={{marginTop:8,fontWeight:600,color:'#7a1a1a',fontSize:13}}>Total: {fmt(opNotesTot)}</div>
        </CustSec>

        <CustSec title="Term Debt / Equipment Loans" open={open.termDebt} onToggle={()=>toggle('termDebt')}>
          {(data.intermediatDebt||[]).map((r,i)=><div key={i} style={{...rowStyle,flexWrap:'wrap'}}>
            <CustInp value={r.creditor} onChange={v=>setArr('intermediatDebt',i,'creditor',v)} placeholder="Lender" style={{flex:'2 1 120px'}}/>
            <CustInp value={r.security} onChange={v=>setArr('intermediatDebt',i,'security',v)} placeholder="Collateral" style={{flex:'2 1 100px'}}/>
            <CustInp prefix="Ann Pmt $" value={r.annualPmt} onChange={v=>setArr('intermediatDebt',i,'annualPmt',v)} placeholder="0" style={{flex:'1 1 80px'}}/>
            <CustInp prefix="Bal $" value={r.principal} onChange={v=>setArr('intermediatDebt',i,'principal',v)} placeholder="0" style={{flex:'1 1 80px'}}/>
            {remBtn('intermediatDebt',i)}
          </div>)}
          {addBtn('intermediatDebt',{creditor:'',security:'',dueDate:'',annualPmt:'',principal:'',rate:''},'Add Loan')}
          <div style={{marginTop:8,fontWeight:600,color:'#7a1a1a',fontSize:13}}>Annual Payments: {fmt(termTot)}</div>
        </CustSec>

        <CustSec title="Real Estate Mortgages" open={open.reMort} onToggle={()=>toggle('reMort')}>
          {(data.reMortgages||[]).map((r,i)=><div key={i} style={rowStyle}><CustInp value={r.lienHolder} onChange={v=>setArr('reMortgages',i,'lienHolder',v)} placeholder="Lender" style={{flex:2}}/><CustInp prefix="Bal $" value={r.principal} onChange={v=>setArr('reMortgages',i,'principal',v)} placeholder="0" style={{flex:1}}/>{remBtn('reMortgages',i)}</div>)}
          {addBtn('reMortgages',{lienHolder:'',terms:'',principal:'',rate:''},'Add Mortgage')}
          <div style={{marginTop:8,fontWeight:600,color:'#7a1a1a',fontSize:13}}>Total: {fmt(reMortTot)}</div>
        </CustSec>

        <CustSec title="Taxes Due & Other Liabilities" open={open.otherL} onToggle={()=>toggle('otherL')}>
          <div style={{marginBottom:10}}>
            {lbl('Income Taxes Due')}
            <CustInp prefix="$" value={data.taxesDue} onChange={v=>updateData({taxesDue:v})} placeholder="0"/>
          </div>
          {(data.otherLiabilities||[]).map((r,i)=><div key={i} style={rowStyle}><CustInp value={r.description} onChange={v=>setArr('otherLiabilities',i,'description',v)} placeholder="Description" style={{flex:2}}/><CustInp prefix="$" value={r.balance} onChange={v=>setArr('otherLiabilities',i,'balance',v)} placeholder="Balance" style={{flex:1}}/>{remBtn('otherLiabilities',i)}</div>)}
          {addBtn('otherLiabilities',{description:'',balance:''},'Add Liability')}
        </CustSec>

        <div style={{background:'#7a1a1a',color:'white',fontWeight:700,padding:'10px 16px',borderRadius:6,marginBottom:12,display:'flex',justifyContent:'space-between'}}>
          <span>TOTAL LIABILITIES</span><span>{fmt(totalLiab)}</span>
        </div>
        <div style={{background:netWorth>=0?'#1a5c25':'#7a1a1a',color:'white',fontWeight:800,padding:'12px 16px',borderRadius:6,marginBottom:24,display:'flex',justifyContent:'space-between',fontSize:16}}>
          <span>NET WORTH</span><span>{fmt(netWorth)}</span>
        </div>

        {/* Signature area */}
        <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:10,padding:20,marginBottom:24}}>
          <div style={{fontWeight:700,fontSize:14,color:'#374151',marginBottom:4}}>Certification</div>
          <p style={{fontSize:13,color:'#555',lineHeight:1.6,marginBottom:0}}>I certify that the information provided above is a true and accurate statement of my financial condition as of the date submitted.</p>
        </div>

        <button onClick={submit} disabled={submitting} style={{width:'100%',background:'#6B0E1E',color:'white',border:'none',borderRadius:10,padding:16,fontWeight:700,fontSize:17,cursor:submitting?'wait':'pointer',opacity:submitting?.7:1,boxShadow:'0 4px 16px rgba(107,14,30,.3)',fontFamily:'inherit'}}>
          {submitting?'⏳ Submitting…':'✅ Submit My Balance Sheet'}
        </button>
        <div style={{textAlign:'center',fontSize:11,color:'#9ca3af',marginTop:10}}>Sent securely to First Bank of Montana · Your draft saves automatically</div>
      </div>
    </div>
  );
}


// ── Customer Budget Form ──────────────────────────────────────────────────────
function CustomerBudgetForm({shareId}) {
  const [stage,setStage]=React.useState('pin');
  const [pin,setPin]=React.useState(''); const [pinErr,setPinErr]=React.useState('');
  const [shareRow,setShareRow]=React.useState(null);
  const [clientName,setClientName]=React.useState('');
  const [crops,setCrops]=React.useState([{id:1,acres:'',crop:'',yieldPerAcre:'',unit:'bu',price:'',share:'100',contracted:false}]);
  const [livestock,setLivestock]=React.useState([{id:1,head:'',type:'',lbs:'',price:''}]);
  const [misc,setMisc]=React.useState([{id:1,description:'Government Payments',amount:''}]);
  const [expenses,setExpenses]=React.useState([]);
  const [expenseList,setExpenseList]=React.useState(()=>loadExpenseList());
  const [customExpense,setCustomExpense]=React.useState('');
  const [saving,setSaving]=React.useState(false);
  const [submitting,setSubmitting]=React.useState(false);
  const saveTimer=React.useRef(null);

  const n=v=>Number((v||'').toString().replace(/[^0-9.-]/g,''))||0;
  const fmt=v=>'$'+(Number(v||0).toLocaleString('en-US',{maximumFractionDigits:0}));
  const uid=()=>Math.random().toString(36).slice(2,8);

  const verifyPin=async()=>{
    setPinErr('');
    try{
      const resp=await fetch(CUST_SUPABASE_URL()+'/rest/v1/budget_shares?share_id=eq.'+shareId+'&select=*',{headers:custHeaders()});
      const rows=await resp.json();
      if(!rows.length){setPinErr('Link not found or expired.');return;}
      const row=rows[0];
      if(new Date(row.expires_at)<new Date()){setStage('expired');return;}
      if(row.status==='reviewed'){setStage('reviewed');return;}
      if(String(row.pin).trim()!==pin.trim()){setPinErr('Incorrect PIN.');return;}
      setShareRow(row);setClientName(row.client_name||'');
      if(row.customer_draft){
        const d=row.customer_draft;
        if(d.budgetCrops)setCrops(d.budgetCrops);
        if(d.budgetLivestock)setLivestock(d.budgetLivestock);
        if(d.budgetMisc)setMisc(d.budgetMisc);
        if(d.budgetExpenses)setExpenses(d.budgetExpenses);
      }
      setStage('form');
    }catch(e){setPinErr('Connection error: '+e.message);}
  };

  const saveDraft=React.useCallback(async(c,l,m,e)=>{
    if(!shareRow)return;
    setSaving(true);
    try{await fetch(CUST_SUPABASE_URL()+'/rest/v1/budget_shares?share_id=eq.'+shareId,{method:'PATCH',headers:{...custHeaders(),'Prefer':'return=minimal'},body:JSON.stringify({customer_draft:{budgetCrops:c,budgetLivestock:l,budgetMisc:m,budgetExpenses:e}})});}catch{}
    setSaving(false);
  },[shareRow,shareId]);

  const schedSave=(c,l,m,e)=>{clearTimeout(saveTimer.current);saveTimer.current=setTimeout(()=>saveDraft(c,l,m,e),1500);};

  const updCrop=(i,f,v)=>{const nc=crops.map((r,j)=>j===i?{...r,[f]:v}:r);setCrops(nc);schedSave(nc,livestock,misc,expenses);};
  const updLS=(i,f,v)=>{const nl=livestock.map((r,j)=>j===i?{...r,[f]:v}:r);setLivestock(nl);schedSave(crops,nl,misc,expenses);};
  const updMisc=(i,f,v)=>{const nm=misc.map((r,j)=>j===i?{...r,[f]:v}:r);setMisc(nm);schedSave(crops,livestock,nm,expenses);};
  const updExp=(i,f,v)=>{const ne=expenses.map((r,j)=>j===i?{...r,[f]:v}:r);setExpenses(ne);schedSave(crops,livestock,misc,ne);};

  const addExpenseFromList=(name)=>{
    if(!name||expenses.some(e=>e.description===name))return;
    const ne=[...expenses,{id:uid(),description:name,amount:''}];
    setExpenses(ne);schedSave(crops,livestock,misc,ne);
  };
  const addCustomExpense=()=>{
    if(!customExpense.trim())return;
    const ne=[...expenses,{id:uid(),description:customExpense.trim(),amount:''}];
    setExpenses(ne);setCustomExpense('');schedSave(crops,livestock,misc,ne);
  };
  const remExp=(i)=>{const ne=expenses.filter((_,j)=>j!==i);setExpenses(ne);schedSave(crops,livestock,misc,ne);};

  const cropTot=crops.reduce((s,r)=>s+n(r.acres)*n(r.yieldPerAcre)*n(r.price)*(n(r.share||100)/100),0);
  const lsTot=livestock.reduce((s,r)=>s+n(r.head)*n(r.lbs)*n(r.price),0);
  const miscTot=misc.reduce((s,r)=>s+n(r.amount),0);
  const totalIncome=cropTot+lsTot+miscTot;
  const totalExpenses=expenses.reduce((s,r)=>s+n(r.amount),0);
  const net=totalIncome-totalExpenses;

  const submit=async()=>{
    setSubmitting(true);
    try{
      await fetch(CUST_SUPABASE_URL()+'/rest/v1/budget_shares?share_id=eq.'+shareId,{method:'PATCH',headers:{...custHeaders(),'Prefer':'return=minimal'},body:JSON.stringify({customer_draft:{budgetCrops:crops,budgetLivestock:livestock,budgetMisc:misc,budgetExpenses:expenses},status:'submitted',submitted_at:new Date().toISOString()})});
      await notifySubmission('budget',shareRow?.client_name||'',shareId);
      setStage('done');
    }catch(e){alert('Submit failed: '+e.message);}
    setSubmitting(false);
  };

  const pageStyle={fontFamily:"'Source Sans 3',system-ui,sans-serif",minHeight:'100vh',background:'#f9f5f5'};
  const cardStyle={background:'white',borderRadius:12,padding:32,maxWidth:600,margin:'0 auto'};

  if(stage==='expired')return <div style={{...pageStyle,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}><div style={{...cardStyle,textAlign:'center'}}><div style={{fontSize:48,marginBottom:12}}>⏰</div><div style={{fontWeight:700,fontSize:18,color:'#991b1b',marginBottom:8}}>Link Expired</div><p style={{color:'#6b7280',fontSize:14}}>This budget link has expired. Please contact your lender.</p></div></div>;
  if(stage==='reviewed')return <div style={{...pageStyle,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}><div style={{...cardStyle,textAlign:'center'}}><div style={{fontSize:48,marginBottom:12}}>✅</div><div style={{fontWeight:700,fontSize:18,color:'#15803d',marginBottom:8}}>Already Submitted</div><p style={{color:'#6b7280',fontSize:14}}>Your budget has been received. Thank you!</p></div></div>;
  if(stage==='done')return <div style={{...pageStyle,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}><div style={{...cardStyle,textAlign:'center'}}><div style={{fontSize:56,marginBottom:12}}>✅</div><div style={{fontWeight:800,fontSize:22,color:'#15803d',marginBottom:8}}>Budget Submitted!</div><p style={{color:'#6b7280',fontSize:14,lineHeight:1.6}}>Your budget has been sent to First Bank of Montana.</p></div></div>;

  if(stage==='pin')return(
    <div style={{...pageStyle,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={cardStyle}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:32,marginBottom:8}}>🌾</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:20,color:'#6B0E1E'}}>First Bank of Montana</div>
          <div style={{fontSize:13,color:'#888',marginTop:4}}>Agricultural Budget Form</div>
        </div>
        <p style={{fontSize:14,color:'#555',marginBottom:20,lineHeight:1.6}}>Your lender has sent you a budget form to fill out. Enter your 6-digit PIN to get started.</p>
        <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>ENTER YOUR 6-DIGIT PIN</label>
        <input type="tel" inputMode="numeric" maxLength={6} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))} onKeyDown={e=>e.key==='Enter'&&verifyPin()} placeholder="000000" style={{width:'100%',border:`1.5px solid ${pinErr?'#fca5a5':'#d1d5db'}`,borderRadius:8,padding:'12px 16px',fontSize:24,fontFamily:'monospace',textAlign:'center',letterSpacing:8,outline:'none',boxSizing:'border-box',marginBottom:pinErr?8:16}}/>
        {pinErr&&<div style={{color:'#991b1b',fontSize:13,marginBottom:14,padding:'8px 12px',background:'#fef2f2',borderRadius:6,border:'1px solid #fca5a5'}}>{pinErr}</div>}
        <button onClick={verifyPin} style={{width:'100%',background:'#6B0E1E',color:'white',border:'none',borderRadius:8,padding:12,fontWeight:700,fontSize:16,cursor:'pointer',fontFamily:'inherit'}}>Open My Budget →</button>
      </div>
    </div>
  );

  const inpStyle={border:'1px solid #d1d5db',borderRadius:6,padding:'7px 10px',fontSize:13,width:'100%',fontFamily:'inherit',outline:'none',boxSizing:'border-box'};
  const secHead=(color,title)=><div style={{background:color,color:'white',fontWeight:700,fontSize:14,padding:'8px 14px',borderRadius:'8px 8px 0 0',letterSpacing:.5,textTransform:'uppercase',marginBottom:0}}>{title}</div>;
  const secBody=(children)=><div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:'0 0 8px 8px',padding:16,marginBottom:16}}>{children}</div>;

  return(
    <div style={pageStyle}>
      <div style={{background:'#6B0E1E',padding:'12px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:99,boxShadow:'0 2px 8px rgba(0,0,0,.3)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:20}}>🌾</span>
          <div><div style={{color:'white',fontWeight:700,fontSize:15}}>First Bank of Montana</div><div style={{color:'rgba(255,255,255,.6)',fontSize:11}}>{clientName} — Budget</div></div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {saving&&<span style={{color:'rgba(255,255,255,.6)',fontSize:12}}>Saving...</span>}
          <button onClick={()=>saveDraft(crops,livestock,misc,expenses)} style={{background:'rgba(255,255,255,.15)',color:'white',border:'1px solid rgba(255,255,255,.3)',borderRadius:5,padding:'6px 14px',cursor:'pointer',fontSize:12,fontWeight:600}}>💾 Save Draft</button>
        </div>
      </div>
      <div style={{maxWidth:700,margin:'0 auto',padding:'20px 16px 80px'}}>
        {/* Running totals */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
          {[['Total Income',totalIncome,'#1a5c25'],['Total Expenses',totalExpenses,'#7a1a1a'],[net>=0?'Net Income':'Net Loss',Math.abs(net),net>=0?'#1a5c25':'#7a1a1a']].map(([l,v,c])=>(
            <div key={l} style={{background:'white',border:'1px solid #e5e7eb',borderRadius:8,padding:'12px 14px',textAlign:'center'}}>
              <div style={{fontSize:11,color:'#888',textTransform:'uppercase',letterSpacing:.3,marginBottom:4}}>{l}</div>
              <div style={{fontSize:18,fontWeight:700,color:c}}>{fmt(v)}</div>
            </div>
          ))}
        </div>

        {/* INCOME */}
        {secHead('#1a5c25','🌱 Income')}
        {secBody(<>
          <div style={{fontWeight:600,fontSize:13,color:'#374151',marginBottom:8}}>Crop Income</div>
          <div style={{display:'grid',gridTemplateColumns:'80px 1fr 80px 60px 80px 60px auto',gap:4,fontSize:11,color:'#888',marginBottom:4,padding:'0 4px'}}>
            {['Acres','Crop','Yield/Ac','Unit','Price','Share%',''].map(h=><div key={h}>{h}</div>)}
          </div>
          {crops.map((r,i)=>(
            <div key={r.id||i} style={{display:'grid',gridTemplateColumns:'80px 1fr 80px 60px 80px 60px auto',gap:4,marginBottom:6,alignItems:'center'}}>
              <input style={inpStyle} type="text" value={r.acres} onChange={e=>updCrop(i,'acres',e.target.value.replace(/[^0-9.]/g,''))} placeholder="0"/>
              <input style={inpStyle} type="text" value={r.crop} onChange={e=>updCrop(i,'crop',e.target.value)} placeholder="Crop"/>
              <input style={inpStyle} type="text" value={r.yieldPerAcre} onChange={e=>updCrop(i,'yieldPerAcre',e.target.value.replace(/[^0-9.]/g,''))} placeholder="0"/>
              <select style={{...inpStyle,padding:'7px 4px'}} value={r.unit||'bu'} onChange={e=>updCrop(i,'unit',e.target.value)}>{['bu','ton','lbs','cwt','bale'].map(u=><option key={u}>{u}</option>)}</select>
              <input style={inpStyle} type="text" value={r.price} onChange={e=>updCrop(i,'price',e.target.value.replace(/[^0-9.]/g,''))} placeholder="0.00"/>
              <input style={inpStyle} type="text" value={r.share??'100'} onChange={e=>updCrop(i,'share',e.target.value.replace(/[^0-9.]/g,''))} placeholder="100"/>
              <button onClick={()=>{const nc=crops.filter((_,j)=>j!==i);setCrops(nc);schedSave(nc,livestock,misc,expenses);}} style={{background:'#fee2e2',color:'#b91c1c',border:'none',borderRadius:4,padding:'4px 8px',cursor:'pointer',fontSize:14}}>×</button>
            </div>
          ))}
          <button onClick={()=>{const nc=[...crops,{id:uid(),acres:'',crop:'',yieldPerAcre:'',unit:'bu',price:'',share:'100',contracted:false}];setCrops(nc);schedSave(nc,livestock,misc,expenses);}} style={{marginTop:4,background:'#e8f5ea',color:'#1a5c25',border:'1.5px dashed #1a5c25',borderRadius:5,padding:'4px 12px',cursor:'pointer',fontSize:12,fontWeight:600}}>+ Add Crop</button>
          <div style={{fontWeight:600,color:'#1a5c25',fontSize:13,marginTop:8}}>Crop Subtotal: {fmt(cropTot)}</div>

          <div style={{fontWeight:600,fontSize:13,color:'#374151',margin:'16px 0 8px'}}>Livestock Income</div>
          {livestock.map((r,i)=>(
            <div key={r.id||i} style={{display:'flex',gap:6,marginBottom:6,alignItems:'center'}}>
              <input style={{...inpStyle,width:70,flex:'none'}} type="text" value={r.head} onChange={e=>updLS(i,'head',e.target.value.replace(/[^0-9.]/g,''))} placeholder="Head"/>
              <input style={{...inpStyle,flex:2}} type="text" value={r.type} onChange={e=>updLS(i,'type',e.target.value)} placeholder="Type / description"/>
              <input style={{...inpStyle,width:80,flex:'none'}} type="text" value={r.lbs} onChange={e=>updLS(i,'lbs',e.target.value.replace(/[^0-9.]/g,''))} placeholder="Lbs/hd"/>
              <input style={{...inpStyle,width:90,flex:'none'}} type="text" value={r.price} onChange={e=>updLS(i,'price',e.target.value.replace(/[^0-9.]/g,''))} placeholder="$/lb"/>
              <button onClick={()=>{const nl=livestock.filter((_,j)=>j!==i);setLivestock(nl);schedSave(crops,nl,misc,expenses);}} style={{background:'#fee2e2',color:'#b91c1c',border:'none',borderRadius:4,padding:'4px 8px',cursor:'pointer',fontSize:14}}>×</button>
            </div>
          ))}
          <button onClick={()=>{const nl=[...livestock,{id:uid(),head:'',type:'',lbs:'',price:''}];setLivestock(nl);schedSave(crops,nl,misc,expenses);}} style={{background:'#e8f5ea',color:'#1a5c25',border:'1.5px dashed #1a5c25',borderRadius:5,padding:'4px 12px',cursor:'pointer',fontSize:12,fontWeight:600}}>+ Add Livestock</button>
          <div style={{fontWeight:600,color:'#1a5c25',fontSize:13,marginTop:8}}>Livestock Subtotal: {fmt(lsTot)}</div>

          <div style={{fontWeight:600,fontSize:13,color:'#374151',margin:'16px 0 8px'}}>Miscellaneous Income (Government Payments, etc.)</div>
          {misc.map((r,i)=>(
            <div key={r.id||i} style={{display:'flex',gap:6,marginBottom:6,alignItems:'center'}}>
              <input style={{...inpStyle,flex:2}} type="text" value={r.description} onChange={e=>updMisc(i,'description',e.target.value)} placeholder="Description"/>
              <input style={{...inpStyle,flex:1}} type="text" value={r.amount} onChange={e=>updMisc(i,'amount',e.target.value.replace(/[^0-9.]/g,''))} placeholder="Amount"/>
              <button onClick={()=>{const nm=misc.filter((_,j)=>j!==i);setMisc(nm);schedSave(crops,livestock,nm,expenses);}} style={{background:'#fee2e2',color:'#b91c1c',border:'none',borderRadius:4,padding:'4px 8px',cursor:'pointer',fontSize:14}}>×</button>
            </div>
          ))}
          <button onClick={()=>{const nm=[...misc,{id:uid(),description:'',amount:''}];setMisc(nm);schedSave(crops,livestock,nm,expenses);}} style={{background:'#e8f5ea',color:'#1a5c25',border:'1.5px dashed #1a5c25',borderRadius:5,padding:'4px 12px',cursor:'pointer',fontSize:12,fontWeight:600}}>+ Add Income</button>
          <div style={{fontWeight:700,color:'#1a5c25',fontSize:14,marginTop:12,padding:'8px 0',borderTop:'2px solid #e5e7eb'}}>TOTAL INCOME: {fmt(totalIncome)}</div>
        </>)}

        {/* EXPENSES */}
        {secHead('#7a1a1a','💰 Expenses')}
        {secBody(<>
          <div style={{marginBottom:14}}>
            <div style={{fontWeight:600,fontSize:13,color:'#374151',marginBottom:8}}>Add from expense list:</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:10}}>
              {expenseList.filter(e=>!expenses.some(x=>x.description===e.name)).map(e=>(
                <button key={e.id} onClick={()=>addExpenseFromList(e.name)} style={{background:'#f5e8ea',color:'#6B0E1E',border:'1px solid #e0b0b8',borderRadius:20,padding:'4px 12px',cursor:'pointer',fontSize:12,fontWeight:500,transition:'all .1s'}}>{e.name}</button>
              ))}
            </div>
            <div style={{display:'flex',gap:8}}>
              <input type="text" value={customExpense} onChange={e=>setCustomExpense(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCustomExpense()} placeholder="Type a custom expense and press Enter..." style={{...inpStyle,flex:1}}/>
              <button onClick={addCustomExpense} style={{background:'#6B0E1E',color:'white',border:'none',borderRadius:6,padding:'7px 14px',cursor:'pointer',fontWeight:600,fontSize:13,whiteSpace:'nowrap'}}>+ Add</button>
            </div>
          </div>
          {expenses.length===0&&<div style={{textAlign:'center',color:'#9ca3af',padding:'16px 0',fontSize:13}}>No expenses yet — click items above to add them.</div>}
          {expenses.map((r,i)=>(
            <div key={r.id||i} style={{display:'flex',gap:8,marginBottom:6,alignItems:'center'}}>
              <div style={{flex:2,fontSize:14,color:'#374151',fontWeight:500,padding:'4px 0'}}>{r.description}</div>
              <input style={{...inpStyle,flex:1,textAlign:'right'}} type="text" value={r.amount} onChange={e=>updExp(i,'amount',e.target.value.replace(/[^0-9.]/g,''))} placeholder="$0"/>
              <button onClick={()=>remExp(i)} style={{background:'#fee2e2',color:'#b91c1c',border:'none',borderRadius:4,padding:'4px 8px',cursor:'pointer',fontSize:14,flexShrink:0}}>×</button>
            </div>
          ))}
          {expenses.length>0&&<div style={{fontWeight:700,color:'#7a1a1a',fontSize:14,marginTop:12,padding:'8px 0',borderTop:'2px solid #e5e7eb'}}>TOTAL EXPENSES: {fmt(totalExpenses)}</div>}
        </>)}

        {/* Net */}
        <div style={{background:net>=0?'#1a5c25':'#7a1a1a',color:'white',fontWeight:800,padding:'14px 18px',borderRadius:8,marginBottom:24,display:'flex',justifyContent:'space-between',fontSize:16}}>
          <span>{net>=0?'PROJECTED NET INCOME':'PROJECTED NET LOSS'}</span><span>{fmt(Math.abs(net))}</span>
        </div>

        <button onClick={submit} disabled={submitting} style={{width:'100%',background:'#6B0E1E',color:'white',border:'none',borderRadius:10,padding:16,fontWeight:700,fontSize:17,cursor:submitting?'wait':'pointer',opacity:submitting?.7:1,boxShadow:'0 4px 16px rgba(107,14,30,.3)',fontFamily:'inherit'}}>
          {submitting?'⏳ Submitting…':'✅ Submit My Budget'}
        </button>
        <div style={{textAlign:'center',fontSize:11,color:'#9ca3af',marginTop:10}}>Sent securely to First Bank of Montana · Your draft saves automatically</div>
      </div>
    </div>
  );
}


// ── Expense List Editor Modal ─────────────────────────────────────────────────
function ExpenseListEditor({expenseList,setExpenseList,onClose}) {
  const [newName,setNewName]=React.useState('');
  const update=(id,name)=>{const ul=expenseList.map(e=>e.id===id?{...e,name}:e);setExpenseList(ul);saveExpenseList(ul);};
  const remove=(id)=>{const ul=expenseList.filter(e=>e.id!==id);setExpenseList(ul);saveExpenseList(ul);};
  const add=()=>{if(!newName.trim())return;const ul=[...expenseList,{id:Date.now(),name:newName.trim()}];setExpenseList(ul);saveExpenseList(ul);setNewName('');};
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'white',borderRadius:14,padding:28,maxWidth:480,width:'100%',maxHeight:'85vh',overflowY:'auto',boxShadow:'0 10px 50px rgba(0,0,0,.25)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div>
            <div style={{fontWeight:700,fontSize:'1.05rem',color:'#1a1a1a'}}>Expense List Editor</div>
            <div style={{fontSize:'.75rem',color:'#888',marginTop:2}}>Customers see these as quick-add buttons on their budget form</div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>{if(window.confirm('Reset to defaults?')){const d=DEFAULT_EXPENSE_LIST.map((name,id)=>({id,name}));setExpenseList(d);saveExpenseList(d);}}} style={{background:'none',border:'1px solid #ddd',borderRadius:6,padding:'4px 10px',color:'#888',fontSize:'.75rem',cursor:'pointer',fontFamily:'inherit'}}>Reset</button>
            <button onClick={onClose} style={{background:'none',border:'none',fontSize:'1.3rem',cursor:'pointer',color:'#888',lineHeight:1}}>×</button>
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          <input type="text" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="Add new expense item..." style={{flex:1,border:'1.5px solid #6B0E1E',borderRadius:6,padding:'8px 12px',fontSize:14,fontFamily:'inherit',outline:'none'}}/>
          <button onClick={add} style={{background:'#6B0E1E',color:'white',border:'none',borderRadius:6,padding:'8px 16px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Add</button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {expenseList.map((e,i)=>(
            <div key={e.id} style={{display:'flex',gap:8,alignItems:'center',padding:'6px 10px',background:i%2===0?'white':'#fafafa',borderRadius:6,border:'1px solid #f0f0f0'}}>
              <span style={{color:'#aaa',fontSize:12,width:20,textAlign:'center'}}>{i+1}</span>
              <input type="text" value={e.name} onChange={ev=>update(e.id,ev.target.value)} style={{flex:1,border:'1px solid #e0e0e0',borderRadius:4,padding:'4px 8px',fontSize:'.9rem',fontFamily:'inherit',outline:'none'}}/>
              <button onClick={()=>remove(e.id)} style={{background:'#fee2e2',color:'#b91c1c',border:'none',borderRadius:4,padding:'2px 7px',cursor:'pointer',fontSize:14}}>×</button>
            </div>
          ))}
        </div>
        <div style={{fontSize:'.72rem',color:'#aaa',marginTop:12,textAlign:'center'}}>Changes save automatically to this device</div>
      </div>
    </div>
  );
}


// ── Supabase storage layer ─────────────────────────────────────────────────────
const SUPABASE_URL = (window.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';

// Auth session — module-level so all storage calls pick it up automatically
let currentSession = null;
try { const s = localStorage.getItem('fbmt_session'); if (s) currentSession = JSON.parse(s); } catch {}

async function supaLogin(email, password) {
  const resp = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error_description || data.msg || 'Login failed');
  currentSession = data;
  try { localStorage.setItem('fbmt_session', JSON.stringify(data)); } catch {}
  return data;
}

async function supaLogout() {
  if (currentSession?.access_token) {
    await fetch(SUPABASE_URL + '/auth/v1/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + currentSession.access_token },
    }).catch(() => {});
  }
  currentSession = null;
  try { localStorage.removeItem('fbmt_session'); } catch {}
}

function isTokenExpired() {
  if (!currentSession?.access_token) return true;
  try {
    const payload = JSON.parse(atob(currentSession.access_token.split('.')[1]));
    // Expired or expiring in next 60 seconds
    return !payload.exp || (payload.exp * 1000 < Date.now() + 60000);
  } catch { return false; } // non-JWT key format — assume still valid
}

async function refreshSession() {
  if (!currentSession?.refresh_token) return null;
  try {
    const resp = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ refresh_token: currentSession.refresh_token }),
    });
    if (!resp.ok) {
      currentSession = null;
      try { localStorage.removeItem('fbmt_session'); } catch {}
      return null;
    }
    const data = await resp.json();
    currentSession = data;
    try { localStorage.setItem('fbmt_session', JSON.stringify(data)); } catch {}
    return data;
  } catch { return null; }
}

async function supaGetProfile() {
  if (!currentSession?.access_token) return null;
  const resp = await fetch(SUPABASE_URL + '/rest/v1/profiles?select=*&id=eq.' + currentSession.user.id, { headers: supaHeaders() });
  if (!resp.ok) return null;
  const rows = await resp.json();
  return rows[0] || null;
}

function isConfigured() {
  return SUPABASE_URL && SUPABASE_URL !== 'https://YOUR_PROJECT_ID.supabase.co'
    && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'YOUR_ANON_KEY_HERE';
}

function supaHeaders() {
  const bearer = currentSession?.access_token || SUPABASE_ANON_KEY;
  return { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + bearer, 'Prefer': 'return=representation' };
}

function parseKey(key) {
  const parts = key.replace('fbmt_bs:', '').split(':');
  return { clientName: parts[0].replace(/_/g, ' '), asOfDate: parts[1] || '' };
}
function makeKey(clientName, asOfDate) {
  return 'fbmt_bs:' + clientName.replace(/\s+/g, '_') + ':' + asOfDate;
}

const storage = {
  async list(prefix) {
    if (!isConfigured()) return { keys: [] };
    const clientPart = prefix.replace('fbmt_bs:', '').replace(/:$/, '').replace(/_/g, ' ');
    let url = SUPABASE_URL + '/rest/v1/balance_sheets?select=client_name,as_of_date&order=as_of_date.desc';
    if (clientPart) url += '&client_name=eq.' + encodeURIComponent(clientPart);
    const resp = await fetch(url, { headers: supaHeaders() });
    if (!resp.ok) {
      const err = await resp.text();
      console.error('Supabase list error:', resp.status, err);
      return { keys: [] };
    }
    const rows = await resp.json();
    return { keys: rows.map(r => makeKey(r.client_name, r.as_of_date)) };
  },
  async get(key) {
    if (!isConfigured()) return null;
    const { clientName, asOfDate } = parseKey(key);
    const url = SUPABASE_URL + '/rest/v1/balance_sheets?client_name=eq.'
      + encodeURIComponent(clientName) + '&as_of_date=eq.' + asOfDate + '&limit=1';
    const resp = await fetch(url, { headers: supaHeaders() });
    if (!resp.ok) return null;
    const rows = await resp.json();
    if (!rows.length) return null;
    return { key, value: JSON.stringify(rows[0].data) };
  },
  async set(key, value) {
    if (!isConfigured()) {
      throw new Error('Supabase not configured — edit public/config.js with your Project URL and anon key');
    }
    const { clientName, asOfDate } = parseKey(key);
    const parsed = JSON.parse(value);
    const body = { client_name: clientName, as_of_date: asOfDate, data: parsed, saved_at: new Date().toISOString(), user_id: currentSession?.user?.id || null };

    // Check if record already exists
    const checkUrl = SUPABASE_URL + '/rest/v1/balance_sheets?client_name=eq.'
      + encodeURIComponent(clientName) + '&as_of_date=eq.' + asOfDate + '&limit=1';
    const checkResp = await fetch(checkUrl, { headers: supaHeaders() });
    const existing = checkResp.ok ? await checkResp.json() : [];

    let resp;
    if (existing.length > 0) {
      // Record exists — update with PATCH
      resp = await fetch(checkUrl, {
        method: 'PATCH',
        headers: supaHeaders(),
        body: JSON.stringify({ data: parsed, saved_at: new Date().toISOString() })
      });
    } else {
      // New record — insert with POST
      resp = await fetch(SUPABASE_URL + '/rest/v1/balance_sheets', {
        method: 'POST',
        headers: supaHeaders(),
        body: JSON.stringify(body)
      });
    }
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error('Database error (' + resp.status + '): ' + err);
    }
    return { key, value };
  },
  async delete(key) {
    if (!isConfigured()) return null;
    const { clientName, asOfDate } = parseKey(key);
    const url = SUPABASE_URL + '/rest/v1/balance_sheets?client_name=eq.'
      + encodeURIComponent(clientName) + '&as_of_date=eq.' + asOfDate;
    const resp = await fetch(url, { method: 'DELETE', headers: supaHeaders() });
    return resp.ok ? { key, deleted: true } : null;
  }
};

// ─── Main BalanceSheet Component ──────────────────────────────────────────────
export default function BalanceSheet() {
  const [step, setStep] = useState(0);
  const [screen, setScreen] = useState("home");

  // ── Route customer links ─────────────────────────────────────────────────────
  const _params = new URLSearchParams(window.location.search);
  const _inspId = _params.get('id');
  const _bsId   = _params.get('bs');
  const _budId  = _params.get('budget');
  if (_inspId) return <CustomerInspectForm shareId={_inspId} />;
  if (_bsId)   return <CustomerBalanceSheetForm shareId={_bsId} />;
  if (_budId)  return <CustomerBudgetForm shareId={_budId} />;
  const [session, setSession] = useState(currentSession);
  const [profile, setProfile] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showShareBudget, setShowShareBudget] = useState(false);
  const [showPriceList, setShowPriceList] = useState(false);
  const [commodityPrices, setCommodityPrices] = useState(() => loadCommodityPrices());
  const [expenseList, setExpenseList] = useState(() => loadExpenseList());
  const [showExpenseEditor, setShowExpenseEditor] = useState(false);
  const [hasCustomerResponse, setHasCustomerResponse] = useState(false);
  const [showInspHistory, setShowInspHistory] = useState(false);
  // Balance sheet share
  const [showBSShareModal, setShowBSShareModal] = useState(false);
  const [bsShareLink, setBSShareLink] = useState('');
  const [bsSharePin, setBSSharePin] = useState('');
  const [bsShareStatus, setBSShareStatus] = useState('');
  // Budget share
  const [showBudgetShareModal, setShowBudgetShareModal] = useState(false);
  const [budgetShareLink, setBudgetShareLink] = useState('');
  const [budgetSharePin, setBudgetSharePin] = useState('');
  const [budgetShareStatus, setBudgetShareStatus] = useState('');
  // Pending reviews
  const [pendingReviews, setPendingReviews] = useState([]);
  const [reviewSaveDate, setReviewSaveDate] = useState({});
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [activeTab, setActiveTab] = useState("balance");
  const [compSheets, setCompSheets] = useState([]);
  const [compLoading, setCompLoading] = useState(false);
  const [compInsight, setCompInsight] = useState("");
  const [compInsightLoading, setCompInsightLoading] = useState(false);
  const [savedSheets, setSavedSheets] = useState([]);
  const [openFolders, setOpenFolders] = useState({});
  const [showSaveFolderPicker, setShowSaveFolderPicker] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(null); // key of sheet being moved
  const [showCreateFolder, setShowCreateFolder] = useState(null); // path where new folder is being created
  const [newFolderName, setNewFolderName] = useState("");
  const [pendingSaveKey, setPendingSaveKey] = useState(null);
  const [selectedFolderPath, setSelectedFolderPath] = useState([]);
  const [userFolders, setUserFolders] = useState([]); // standalone folders (path arrays)
  const [editingFolder, setEditingFolder] = useState(null); // { path, newName }
  const [linkedEntityNWMap, setLinkedEntityNWMap] = useState({}); // { clientName: netWorth }
  const [availableEntities, setAvailableEntities] = useState([]);
  const [corpPersonalDebt, setCorpPersonalDebt] = useState([]); // debt items paid by this entity on behalf of personal clients
  const [saveStatus, setSaveStatus] = useState(null);
  const [data, setData] = useState(emptyData());

  useEffect(() => {
    const fl = document.createElement("link");
    fl.id = "fbmt-fonts"; fl.rel = "stylesheet";
    fl.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght"
      + "@600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap";
    if (!document.getElementById("fbmt-fonts")) document.head.appendChild(fl);
    const el = document.createElement("style");
    el.id = "fbmt-styles"; el.textContent = FBMT_CSS;
    if (!document.getElementById("fbmt-styles")) document.head.appendChild(el);
  }, []);

  useEffect(() => {
    if (session?.access_token) supaGetProfile().then(p => setProfile(p)).catch(() => {});
  }, [session?.access_token]);

  // Auto-refresh JWT — check on mount, then every 50 min (token expires after 1hr)
  useEffect(() => {
    if (!session) return;
    const doRefresh = async () => {
      if (isTokenExpired()) {
        const newSession = await refreshSession();
        if (newSession) setSession({ ...newSession });
        else { setSession(null); setProfile(null); }
      }
    };
    doRefresh(); // check immediately on mount
    const interval = setInterval(async () => {
      const newSession = await refreshSession();
      if (newSession) setSession({ ...newSession });
      else { setSession(null); setProfile(null); }
    }, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [!!session]);

  // Auto-check for customer response when a sheet with a shareId is open
  useEffect(() => {
    if (!data.inspShareId || !isConfigured()) return;
    fetch(SUPABASE_URL + '/rest/v1/inspection_shares?share_id=eq.' + data.inspShareId + '&select=responded_at',
      { headers: supaHeaders() })
      .then(r => r.json())
      .then(rows => { setHasCustomerResponse(!!(rows[0]?.responded_at)); })
      .catch(() => {});
  }, [data.inspShareId]);

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const setArr = (k, idx, field, v) => setData(d => {
    const arr = [...d[k]]; arr[idx] = { ...arr[idx], [field]: v }; return { ...d, [k]: arr };
  });
  const addRow = (k, tpl) => {
    setData(d => {
      const newArr = [...d[k], { ...tpl }];
      // Schedule focus on first text field of the new row after render
      setTimeout(() => {
        const newIdx = newArr.length - 1;
        const selector = `[data-rowkey="${k}-${newIdx}"] input, [data-rowkey="${k}-${newIdx}"] select`;
        const el = document.querySelector(selector);
        if (el) el.focus();
      }, 30);
      return { ...d, [k]: newArr };
    });
  };
  const removeRow = (k, idx) => setData(d => ({ ...d, [k]: d[k].filter((_,i) => i !== idx) }));


  const toggleFolder = (name) => {
    setOpenFolders(f => ({ ...f, [name]: !f[name] }));
  };

  const createFolder = (path) => {
    const newFolders = [...userFolders];
    const pathStr = JSON.stringify(path);
    if (!newFolders.some(f => JSON.stringify(f) === pathStr)) {
      newFolders.push(path);
      setUserFolders(newFolders);
      try { localStorage.setItem("fbmt_userFolders", JSON.stringify(newFolders)); } catch {}
    }
  };
  // ── Storage ────────────────────────────────────────────────────────────────
  const loadSavedList = async () => {
    try {
      const result = await storage.list(STORAGE_PREFIX);
      if (result && result.keys) {
        const sheets = [];
        for (const key of result.keys) {
          try {
            const item = await storage.get(key);
            if (item) {
              const p = JSON.parse(item.value);
              sheets.push({ key, clientName: p.clientName, asOfDate: p.asOfDate, savedAt: p._savedAt, folderPath: p.folderPath || [] });
            }
          } catch {}
        }
        sheets.sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""));
        setSavedSheets(sheets);
      }
    } catch {}
  };
  useEffect(() => {
    loadSavedList();
    loadPendingReviews();
    try {
      const stored = localStorage.getItem("fbmt_userFolders");
      if (stored) setUserFolders(JSON.parse(stored));
    } catch {}
  }, []);

  // Load available entities for the link picker
  useEffect(() => {
    if (savedSheets.length > 0) {
      const linked = data.linkedEntities || [];
      const names = [...new Set(savedSheets.map(s => s.clientName))]
        .filter(n => n !== data.clientName && !linked.includes(n))
        .sort();
      setAvailableEntities(names);
    }
  }, [savedSheets, data.clientName, JSON.stringify(data.linkedEntities)]);

  // Auto-reload corp personal debt when client name changes
  useEffect(() => {
    if (data.clientName) loadCorpPersonalDebt();
  }, [data.clientName]);

  const [confirmSave, setConfirmSave] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState(null);
  const [importError, setImportError] = useState("");
  const [importDate, setImportDate] = useState(new Date().toISOString().slice(0,10));
  const [importDragging, setImportDragging] = useState(false);

  const saveSheet = async () => {
    if (!data.clientName) return;
    const key = STORAGE_PREFIX + data.clientName.replace(/\s+/g,"_") + ":" + data.asOfDate;
    // Check if already exists
    try {
      const existing = await storage.get(key);
      if (existing) {
        const p = JSON.parse(existing.value);
        // If it has a folder already, just confirm overwrite without folder picker
        if (p.folderPath && p.folderPath.length > 0) {
          setConfirmSave({ key, label: data.clientName + " — " + data.asOfDate });
          return;
        }
      }
    } catch {}
    // Show folder picker
    setPendingSaveKey(key);
    setSelectedFolderPath(data.folderPath && data.folderPath.length > 0 ? [...data.folderPath] : []);
    setShowSaveFolderPicker(true);
  };

  const doSave = async (key, folderPathOverride) => {
    setSaveStatus("saving");
    setConfirmSave(null);
    try {
      const fp = folderPathOverride !== undefined ? folderPathOverride : (data.folderPath || []);
      const savePayload = { ...data, folderPath: fp, _savedAt: new Date().toISOString() };
      await storage.set(key, JSON.stringify(savePayload));
      set("folderPath", fp);
      setSaveStatus("saved");
      await loadSavedList();
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus(err.message || "error");
      setTimeout(() => setSaveStatus(null), 8000);
    }
  };
  const loadSheet = async (key) => {
    try {
      const item = await storage.get(key);
      if (item) {
        const p = JSON.parse(item.value); delete p._savedAt;
        setData({ ...emptyData(), ...p }); setStep(0); setScreen("wizard");
      }
    } catch {}
  };
  const startNew = () => { setData(emptyData()); setStep(0); setScreen("wizard"); };

  // ── Import helpers ─────────────────────────────────────────────────────────
  async function downloadTemplate() {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
    const XLSX = window.XLSX;
    const rows = [
      ["SECTION","FIELD1","FIELD2","FIELD3","FIELD4","FIELD5","FIELD6","NOTES"],
      ["CLIENT","clientName","asOfDate","","","","","e.g. John Smith, 2024-12-31"],
      ["CASH_GLACIER","amount","","","","","","Glacier Bank / FBMT balance"],
      ["CASH_OTHER","institution","amount","","","","","Other bank accounts - one row per bank"],
      ["RECEIVABLES","description","amount","","","","","Current receivables due within 1 year"],
      ["FEDERAL_PAYMENTS","amount","","","","","","FSA/ARC/PLC/CRP payments"],
      ["LIVESTOCK_MARKET","number","kind","value","","","","Market livestock - one row per group"],
      ["FARM_PRODUCTS","quantity","unit","kind","pricePerUnit","share","contracted","Grain/hay on hand - one row per commodity"],
      ["CROP_INVESTMENT","cropType","acres","valuePerAcre","","","","Growing crops - input costs"],
      ["SUPPLIES","description","value","","","","","Fuel, chemicals, seed, parts"],
      ["OTHER_CURRENT","description","amount","","","","","Other current assets"],
      ["BREEDING_STOCK","number","kind","value","","","","Breeding cattle/horses"],
      ["REAL_ESTATE","acres","reType","description","valuePerAcre","","","One row per tract"],
      ["RE_CONTRACTS","description","amount","","","","","RE sale contracts receivable"],
      ["VEHICLES","year","make","vin","condition","value","","Titled vehicles - one row each"],
      ["MACHINERY","year","make","size","serial","condition","value","Equipment - one row each"],
      ["OTHER_ASSETS","description","amount","","","","","Investments, retirement, etc."],
      ["OPERATING_NOTES","creditor","dueDate","pmt","balance","security","","Operating lines of credit"],
      ["ACCOUNTS_DUE","creditor","amount","","","","","Trade accounts owed"],
      ["INTERMEDIATE_DEBT","creditor","security","dueDate","annualPmt","principal","rate","Equipment loans, term notes"],
      ["RE_CURRENT","creditor","annualPmt","rate","","","","Current RE mortgage payments"],
      ["TAXES_DUE","amount","","","","","","State/federal income taxes due"],
      ["OTHER_CURRENT_LIAB","description","amount","","","","","Other current liabilities"],
      ["RE_MORTGAGES","lienHolder","terms","rate","principal","","","Long-term RE mortgages"],
      ["OTHER_LIABILITIES","description","balance","","","","","Other long-term liabilities"],
      ["","","","","","","","--- EXAMPLE DATA BELOW ---"],
      ["CLIENT","Smith Farms","2024-12-31","","","","",""],
      ["CASH_GLACIER","125000","","","","","",""],
      ["CASH_OTHER","FCS of Great Falls","45000","","","","",""],
      ["FARM_PRODUCTS","50000","bu","winter wheat","5.50","100","true",""],
      ["FARM_PRODUCTS","15000","bu","barley","4.20","50","false","50% crop share"],
      ["REAL_ESTATE","640","Cropland","NW Sec 12 Cascade Co","2800","","",""],
      ["MACHINERY","2019","John Deere 8320","320hp","RW8320P123456","Good","185000",""],
      ["INTERMEDIATE_DEBT","FBMT","2019 JD 8320","2025-01-15","18500","92000","5.25",""],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [12,18,14,14,12,10,12,35].map(w=>({wch:w}));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Balance Sheet Import");
    XLSX.writeFile(wb, "FBMT_Balance_Sheet_Import_Template.xlsx");
  }

  async function loadScript(src) {
    if (window.__loadedScripts && window.__loadedScripts[src]) return;
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = () => {
        if (!window.__loadedScripts) window.__loadedScripts = {};
        window.__loadedScripts[src] = true;
        res();
      };
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  async function parseImportFile(file) {
    setImportError("");
    setImportData(null);
    const ext = file.name.split(".").pop().toLowerCase();

    function processRows(rows) {
      try {
        // Helper: safe cell value as string
        const cell = (row, col) => {
          if (!row || row[col] === undefined || row[col] === null) return "";
          const v = row[col];
          // Skip formula strings
          if (typeof v === "string" && v.startsWith("=")) return "";
          if (v instanceof Date) return v.toISOString().slice(0,10);
          return String(v).trim();
        };
        const num = (row, col) => {
          const v = cell(row, col);
          return v ? v.replace(/[^0-9.]/g, "") : "";
        };

        // Detect format: FBMT native Excel OR generic section-based CSV/Excel
        const r0 = rows[0] || [];
        const r1 = rows[1] || [];
        const r6 = rows[6] || [];
        const isFBMT = (cell(r1,2) || "").includes("Balance Sheet") ||
                       (cell(r6,0) === "Name:" || cell(r6,5) === "As of Date:");

        if (isFBMT) {
          // ── FBMT Native Excel Format ──────────────────────────────────────
          const R = (i) => rows[i] || []; // 0-indexed

          // Client info (row 7 = index 6)
          const clientName = cell(R(6), 1);
          const rawDate = R(6)[6];
          const asOfDate = rawDate instanceof Date
            ? rawDate.toISOString().slice(0,10)
            : rawDate ? String(rawDate).slice(0,10) : importDate;

          // Cash on Hand (row 10 = index 9, col D = index 3)
          const cashGlacier = num(R(9), 3);

          // Current Receivables (rows 12-14 = index 11-13, col A=desc, D=value)
          const receivables = [];
          for (let i = 11; i <= 13; i++) {
            const desc = cell(R(i), 0);
            const val = num(R(i), 3);
            if (desc && !desc.includes("If Above") && !desc.includes("Federal")) {
              receivables.push({description: desc, amount: val});
            }
          }

          // Federal Payments (row 16 = index 15, col D)
          const fedAmt = num(R(15), 3) || num(R(16), 3);
          const federalPayments = fedAmt ? [{program:"Government Payments",amount:fedAmt}] : [{program:"",amount:""}];

          // Market Livestock (rows 19-21 = index 18-20, A=num, B=kind, C=value/head)
          const livestockMarket = [];
          for (let i = 18; i <= 21; i++) {
            const n = cell(R(i), 0);
            const k = cell(R(i), 1);
            const v = num(R(i), 2);
            if (k && !k.includes("Kind") && !k.includes("Number")) {
              const total = n && v ? String(parseFloat(n) * parseFloat(v)) : v;
              livestockMarket.push({number: n, kind: k, value: total});
            }
          }

          // Farm Products (rows 24-33 = index 23-32, A=qty, B=kind, C=price/unit)
          const farmProducts = [];
          for (let i = 23; i <= 32; i++) {
            const qty = cell(R(i), 0);
            const kind = cell(R(i), 1);
            const price = cell(R(i), 2);
            if (kind && !kind.includes("Kind") && !kind.includes("Quantity")) {
              farmProducts.push({quantity: qty||"", unit:"bu", kind: kind, pricePerUnit: price||"", share:"100", contracted:false});
            }
          }

          // Cash Investment / Crops (rows 35 = index 34, A=acres, B=kind, C=value/acre)
          const cropInvestment = [];
          for (let i = 34; i <= 35; i++) {
            const acres = cell(R(i), 0);
            const kind = cell(R(i), 1);
            const vpa = cell(R(i), 2);
            if (kind && acres) {
              cropInvestment.push({cropType: kind, acres: acres, valuePerAcre: vpa||""});
            }
          }

          // Supplies (row 37 = index 36, B=desc, D=value)
          const supplies = [];
          for (let i = 36; i <= 37; i++) {
            const desc = cell(R(i), 1);
            const val = num(R(i), 3);
            if (desc && !desc.includes("Supplies")) {
              supplies.push({description: desc, value: val});
            }
          }

          // Other Current Assets / Hay etc (rows 39-41 = index 38-40)
          const otherCurrent = [];
          for (let i = 38; i <= 41; i++) {
            const qty = cell(R(i), 0);
            const kind = cell(R(i), 1);
            const price = cell(R(i), 2);
            if (kind && !kind.includes("Other Current") && !kind.includes("Creditor")) {
              const val = qty && price ? String(parseFloat(qty||0) * parseFloat(price||0)) : num(R(i),3);
              otherCurrent.push({description: (qty ? qty + " " : "") + kind, amount: val});
            }
          }

          // Breeding Stock (rows 46-52 = index 45-51, A=num, B=kind, C=value/head)
          const breedingStock = [];
          for (let i = 45; i <= 52; i++) {
            const n = cell(R(i), 0);
            const k = cell(R(i), 1);
            const v = cell(R(i), 2);
            if (k && !k.includes("Kind") && !k.includes("Number")) {
              const total = n && v ? String(parseFloat(n||0) * parseFloat(v||0)) : "";
              breedingStock.push({number: n, kind: k, value: total});
            }
          }

          // Real Estate (from supplement rows 81-86 = index 80-85, A=desc, C=acres, J=value)
          const realEstate = [];
          for (let i = 80; i <= 86; i++) {
            const desc = cell(R(i), 0);
            const acres = cell(R(i), 2);
            const val = num(R(i), 9);
            if (desc && !desc.includes("Description") && !desc.includes("TOTAL")) {
              const vpa = acres && val && parseFloat(acres) > 0
                ? String((parseFloat(val) / parseFloat(acres)).toFixed(0)) : "";
              realEstate.push({acres: acres, reType:"Cropland", description: desc, valuePerAcre: vpa});
            }
          }

          // Other Assets (rows 63-66 = index 62-65, B=desc, D=value)
          const otherAssets = [];
          for (let i = 62; i <= 66; i++) {
            const desc = cell(R(i), 1);
            const val = num(R(i), 3);
            if (desc) otherAssets.push({description: desc, amount: val});
          }

          // Operating Notes / Liabilities (rows 12-14 = index 11-13, F=creditor, J=balance)
          const operatingNotes = [];
          for (let i = 11; i <= 14; i++) {
            const cred = cell(R(i), 5);
            const bal = num(R(i), 9);
            if (cred && !cred.includes("Operating") && !cred.includes("Unsecured")) {
              operatingNotes.push({creditor: cred, dueDate:"", pmt:"", balance: bal, security:""});
            }
          }

          // Intermediate Term Debt (rows 21 = index 20, F=creditor, G=security, H=due, I=pmt, J=principal)
          const intermediatDebt = [];
          for (let i = 20; i <= 25; i++) {
            const cred = cell(R(i), 5);
            const sec2 = cell(R(i), 6);
            const due = cell(R(i), 7);
            const pmt = num(R(i), 8);
            const prin = num(R(i), 9);
            if (cred && !cred.includes("Creditor") && !cred.includes("Intermediate")) {
              intermediatDebt.push({creditor:cred, security:sec2, dueDate:due, annualPmt:pmt, principal:prin, rate:""});
            }
          }

          // Current RE Mortgage (rows 40-42 = index 39-41, F=creditor, J=annual pmt)
          const reCurrent = [];
          for (let i = 39; i <= 42; i++) {
            const cred = cell(R(i), 5);
            const pmt = num(R(i), 9);
            if (cred && !cred.includes("Creditor") && !cred.includes("Current Portion") && !cred.includes("Independence - accrued")) {
              reCurrent.push({creditor: cred, annualPmt: pmt, rate:""});
            }
          }

          // Taxes Due (row 43 = index 42)
          const taxesDue = "";

          // RE Mortgages LT (rows 52-54 = index 51-53, F=lienholder, G=terms, J=principal)
          const reMortgages = [];
          for (let i = 51; i <= 56; i++) {
            const lh = cell(R(i), 5);
            const terms = cell(R(i), 6);
            const prin = num(R(i), 9);
            if (lh && !lh.includes("Lien") && !lh.includes("Real Estate") && lh.trim()) {
              reMortgages.push({lienHolder: lh, terms: terms, principal: prin, rate:""});
            }
          }

          // Other Liabilities (rows 56-58 = index 55-57, F=desc, J=balance)
          const otherLiabilities = [];
          for (let i = 55; i <= 58; i++) {
            const desc = cell(R(i), 5);
            const bal = num(R(i), 9);
            if (desc && !desc.includes("Other Liabilities")) {
              otherLiabilities.push({description: desc, balance: bal});
            }
          }

          // Vehicles (from supplement rows 112-121 = index 111-120)
          const vehicles = [];
          for (let i = 111; i <= 121; i++) {
            const yr = cell(R(i), 1);
            const make = cell(R(i), 2);
            const model = cell(R(i), 5);
            const item = cell(R(i), 6);
            const cond = cell(R(i), 8);
            const val = num(R(i), 9);
            const fullMake = [make, model || item].filter(Boolean).join(" ");
            if (fullMake && val) {
              vehicles.push({year: yr, make: fullMake, vin:"", condition: cond, value: val});
            }
          }

          // Machinery (from supplement rows 126-141 = index 125-140)
          const machinery = [];
          for (let i = 125; i <= 141; i++) {
            const yr = cell(R(i), 1);
            const make = cell(R(i), 2);
            const size = cell(R(i), 3);
            const model = cell(R(i), 5);
            const item = cell(R(i), 6);
            const serial = cell(R(i), 7);
            const cond = cell(R(i), 8);
            const val = num(R(i), 9);
            const fullMake = [make, model || item].filter(Boolean).join(" ");
            if (fullMake && val) {
              machinery.push({year: yr, make: fullMake, size: size||"", serial: serial||"", condition: cond||"", value: val});
            }
          }

          const fill = (arr, key) => arr.length ? arr : emptyData()[key];
          const result = {
            ...emptyData(),
            clientName, asOfDate, cashGlacier, federalPayments, taxesDue,
            receivables: fill(receivables,"receivables"),
            livestockMarket: fill(livestockMarket,"livestockMarket"),
            farmProducts: fill(farmProducts,"farmProducts"),
            cropInvestment: fill(cropInvestment,"cropInvestment"),
            supplies: fill(supplies,"supplies"),
            otherCurrent: fill(otherCurrent,"otherCurrent"),
            breedingStock: fill(breedingStock,"breedingStock"),
            realEstate: fill(realEstate,"realEstate"),
            otherAssets: fill(otherAssets,"otherAssets"),
            operatingNotes: fill(operatingNotes,"operatingNotes"),
            intermediatDebt: fill(intermediatDebt,"intermediatDebt"),
            reCurrent: fill(reCurrent,"reCurrent"),
            reMortgages: fill(reMortgages,"reMortgages"),
            otherLiabilities: fill(otherLiabilities,"otherLiabilities"),
            vehicles: fill(vehicles,"vehicles"),
            machinery: fill(machinery,"machinery"),
          };
          setImportData(result);

        } else {
          // ── Generic Section-Based Format (original template) ──────────────
          const arrays = {
            cashOther:[], receivables:[], livestockMarket:[], farmProducts:[],
            federalPayments:[],
            cropInvestment:[], supplies:[], otherCurrent:[], breedingStock:[],
            realEstate:[], reContracts:[], vehicles:[], machinery:[], otherAssets:[],
            operatingNotes:[], accountsDue:[], intermediatDebt:[], reCurrent:[],
            otherCurrentLiab:[], reMortgages:[], otherLiabilities:[]
          };
          let taxesDue = "", cashGlacier = "", clientName = "", asOfDate = importDate;
          if (!arrays.federalPayments) arrays.federalPayments = [];

          for (const row of rows) {
            if (!row || !row[0]) continue;
            const sec = String(row[0]).trim().toUpperCase();
            const f = (i) => (row[i] !== undefined && row[i] !== null) ? String(row[i]).trim() : "";
            if (sec === "CLIENT") { if (f(1)) clientName=f(1); if (f(2)) asOfDate=f(2); }
            else if (sec === "CASH_GLACIER") { cashGlacier = f(1); }
            else if (sec === "CASH_OTHER" && (f(1)||f(2))) arrays.cashOther.push({institution:f(1),amount:f(2)});
            else if (sec === "RECEIVABLES" && (f(1)||f(2))) arrays.receivables.push({description:f(1),amount:f(2)});
            else if (sec === "FEDERAL_PAYMENTS") {
              if (f(1)||f(2)) arrays.federalPayments.push({program:f(1)||"Government Payment",amount:f(2)||f(1)});
            }
            else if (sec === "LIVESTOCK_MARKET" && (f(1)||f(2)||f(3))) arrays.livestockMarket.push({number:f(1),kind:f(2),value:f(3)});
            else if (sec === "FARM_PRODUCTS" && (f(1)||f(3))) arrays.farmProducts.push({quantity:f(1),unit:f(2)||"bu",kind:f(3),pricePerUnit:f(4),share:f(5)||"100",contracted:f(6).toLowerCase()==="true"||f(6)==="1"||f(6).toLowerCase()==="yes"});
            else if (sec === "CROP_INVESTMENT" && (f(1)||f(2))) arrays.cropInvestment.push({cropType:f(1),acres:f(2),valuePerAcre:f(3)});
            else if (sec === "SUPPLIES" && (f(1)||f(2))) arrays.supplies.push({description:f(1),value:f(2)});
            else if (sec === "OTHER_CURRENT" && (f(1)||f(2))) arrays.otherCurrent.push({description:f(1),amount:f(2)});
            else if (sec === "BREEDING_STOCK" && (f(1)||f(2)||f(3))) arrays.breedingStock.push({number:f(1),kind:f(2),value:f(3)});
            else if (sec === "REAL_ESTATE" && (f(1)||f(2))) arrays.realEstate.push({acres:f(1),reType:f(2),description:f(3),valuePerAcre:f(4)});
            else if (sec === "RE_CONTRACTS" && (f(1)||f(2))) arrays.reContracts.push({description:f(1),amount:f(2)});
            else if (sec === "VEHICLES" && (f(1)||f(2))) arrays.vehicles.push({year:f(1),make:f(2),vin:f(3),condition:f(4),value:f(5)});
            else if (sec === "MACHINERY" && (f(1)||f(2))) arrays.machinery.push({year:f(1),make:f(2),size:f(3),serial:f(4),condition:f(5),value:f(6)});
            else if (sec === "OTHER_ASSETS" && (f(1)||f(2))) arrays.otherAssets.push({description:f(1),amount:f(2)});
            else if (sec === "OPERATING_NOTES" && (f(1)||f(4))) arrays.operatingNotes.push({creditor:f(1),dueDate:f(2),pmt:f(3),balance:f(4),security:f(5)});
            else if (sec === "ACCOUNTS_DUE" && (f(1)||f(2))) arrays.accountsDue.push({creditor:f(1),amount:f(2)});
            else if (sec === "INTERMEDIATE_DEBT" && (f(1)||f(5))) arrays.intermediatDebt.push({creditor:f(1),security:f(2),dueDate:f(3),annualPmt:f(4),principal:f(5),rate:f(6)});
            else if (sec === "RE_CURRENT" && (f(1)||f(2))) arrays.reCurrent.push({creditor:f(1),annualPmt:f(2),rate:f(3)});
            else if (sec === "TAXES_DUE") { taxesDue = f(1); }
            else if (sec === "OTHER_CURRENT_LIAB" && (f(1)||f(2))) arrays.otherCurrentLiab.push({description:f(1),amount:f(2)});
            else if (sec === "RE_MORTGAGES" && (f(1)||f(4))) arrays.reMortgages.push({lienHolder:f(1),terms:f(2),rate:f(3),principal:f(4)});
            else if (sec === "OTHER_LIABILITIES" && (f(1)||f(2))) arrays.otherLiabilities.push({description:f(1),balance:f(2)});
          }
          Object.keys(arrays).forEach(k => { if (!arrays[k].length) arrays[k] = emptyData()[k]; });
          const fedArr = arrays.federalPayments.length > 0 ? arrays.federalPayments : [{program:"",amount:""}];
          setImportData({ ...emptyData(), clientName, asOfDate, cashGlacier, federalPayments:fedArr, taxesDue, ...arrays });
        }
      } catch(e) {
        setImportError("Parse error: " + e.message + " — check the file format and try again.");
      }
    }

    try {
      if (ext === "csv") {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js");
        window.Papa.parse(file, {
          complete: (r) => processRows(r.data),
          error: (e) => setImportError("CSV parse error: " + e.message)
        });
      } else if (ext === "xlsx" || ext === "xls") {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const wb = window.XLSX.read(e.target.result, {type:"array"});
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = window.XLSX.utils.sheet_to_json(ws, {header:1, defval:""});
            processRows(rows);
          } catch(err) {
            setImportError("Excel parse error: " + err.message);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        setImportError("Unsupported file type. Please use .csv, .xlsx, or .xls");
      }
    } catch(err) {
      setImportError("Failed to load parser: " + err.message);
    }
  }

  function handleImportFile(file) {
    if (!file) return;
    parseImportFile(file);
  }

  function applyImport() {
    if (!importData) return;
    const d = { ...importData, asOfDate: importDate };
    setData(d);
    setStep(0);
    setScreen("wizard");
    setShowImport(false);
    setImportData(null);
  }
  const deleteSheet = async (key, e) => {
    e.stopPropagation();
    try { await storage.delete(key); await loadSavedList(); } catch {}
  };

  // ── Calculations ───────────────────────────────────────────────────────────
  const n = numVal;
  const cashTotal = n(data.cashGlacier) + data.cashOther.reduce((s,r)=>s+n(r.amount),0);
  const recTotal = data.receivables.reduce((s,r)=>s+n(r.amount),0);
  const fedPay = Array.isArray(data.federalPayments)
    ? data.federalPayments.reduce((s,r)=>s+n(r.amount),0)
    : n(data.federalPayments);
  const lsMktTotal = data.livestockMarket.reduce((s,r)=>s+n(r.value),0);
  const farmProdTotal = data.farmProducts.reduce((s,r)=>s+n(r.quantity)*n(r.pricePerUnit)*(n(r.share||"100")/100),0);
  const cropInv = data.cropInvestment.reduce((s,r)=>s+n(r.acres)*n(r.valuePerAcre),0);
  const suppliesTotal = data.supplies.reduce((s,r)=>s+n(r.value),0);
  const otherCurTotal = data.otherCurrent.reduce((s,r)=>s+n(r.amount),0);
  const totalCurrentAssets = cashTotal+recTotal+fedPay+lsMktTotal+farmProdTotal+cropInv+suppliesTotal+otherCurTotal;
  const breedingTotal = data.breedingStock.reduce((s,r)=>s+n(r.value),0);
  const reTotal = data.realEstate.reduce((s,r)=>s+n(r.acres)*n(r.valuePerAcre),0);
  const reConTotal = data.reContracts.reduce((s,r)=>s+n(r.amount),0);
  const vehiclesVal = data.vehicles.reduce((s,r)=>s+n(r.value),0);
  const machVal = data.machinery.reduce((s,r)=>s+n(r.value),0);
  const otherAssetsTotal = data.otherAssets.reduce((s,r)=>s+n(r.amount),0);
  const totalLTAssets = breedingTotal+reTotal+reConTotal+vehiclesVal+machVal+otherAssetsTotal;
  const linkedEntityVal = Object.values(linkedEntityNWMap).reduce((s,v)=>s+v,0);
  const totalAssets = totalCurrentAssets + totalLTAssets + linkedEntityVal;
  const opNotesTotal = data.operatingNotes.reduce((s,r)=>s+n(r.balance),0);
  const acctsDueTotal = data.accountsDue.reduce((s,r)=>s+n(r.amount),0);
  const intermedCurrentPortion = data.intermediatDebt.reduce((s,r)=>s+n(r.annualPmt),0);
  const intermedLTPortion = data.intermediatDebt.reduce((s,r)=>s+Math.max(0,n(r.principal)-n(r.annualPmt)),0);
  const intermedTotal = intermedCurrentPortion; // alias used in summary display
  const reCurrentTotal = data.reCurrent.reduce((s,r)=>s+n(r.annualPmt),0);
  const taxesDueVal = n(data.taxesDue);
  const otherCLTotal = data.otherCurrentLiab.reduce((s,r)=>s+n(r.amount),0);
  const totalCurrentLiab = opNotesTotal+acctsDueTotal+intermedCurrentPortion+reCurrentTotal+taxesDueVal+otherCLTotal;
  const reMortTotal = data.reMortgages.reduce((s,r)=>s+n(r.principal),0);
  const otherLiabTotal = data.otherLiabilities.reduce((s,r)=>s+n(r.balance),0);
  const totalLiabilities = totalCurrentLiab + intermedLTPortion + reMortTotal + otherLiabTotal;
  const netWorth = totalAssets - totalLiabilities;
  const workingCapital = totalCurrentAssets - totalCurrentLiab;

  // Budget calcs
  const budgetCropTotal = data.budgetCrops.reduce((s,r)=>s+n(r.acres)*n(r.yieldPerAcre)*n(r.price)*(n(r.share||"100")/100),0);
  const budgetLivestockTotal = data.budgetLivestock.reduce((s,r)=>s+n(r.head)*n(r.lbs)*n(r.price),0);
  const budgetMiscTotal = data.budgetMisc.reduce((s,r)=>s+n(r.amount),0);
  const budgetTotalIncome = budgetCropTotal + budgetLivestockTotal + budgetMiscTotal;
  const budgetOperatingExpenses = data.budgetExpenses.reduce((s,r)=>s+n(r.amount),0);
  const debtServiceTerms = data.intermediatDebt.filter(r=>r.creditor && n(r.annualPmt)>0);
  const debtServiceRE = data.reCurrent.filter(r=>r.creditor && n(r.annualPmt)>0);
  const debtServiceTermsPersonal = debtServiceTerms.filter(r=>!r.corpPaid);
  const debtServiceTermsCorp = debtServiceTerms.filter(r=>r.corpPaid);
  const debtServiceREPersonal = debtServiceRE.filter(r=>!r.corpPaid);
  const debtServiceRECorp = debtServiceRE.filter(r=>r.corpPaid);
  const budgetTermDebtTotal = debtServiceTermsPersonal.reduce((s,r)=>s+n(r.annualPmt),0);
  const budgetREDebtTotal = debtServiceREPersonal.reduce((s,r)=>s+n(r.annualPmt),0);
  const budgetTotalDebtService = budgetTermDebtTotal + budgetREDebtTotal;
  const budgetCorpDebtTotal = [...debtServiceTermsCorp,...debtServiceRECorp].reduce((s,r)=>s+n(r.annualPmt),0);
  const budgetPersonalDebtTotal = budgetTotalDebtService;
  const budgetTotalExpenses = budgetOperatingExpenses + budgetTotalDebtService;
  const budgetNetIncome = budgetTotalIncome - budgetTotalExpenses;

  // Comparison helpers
  const SECTION_BREAKS = new Set(["Total Current Assets","TOTAL ASSETS","Total Current Liab","TOTAL LIABILITIES","NET WORTH"]);
  const SECTION_HEADERS = {
    "Cash & Bank": "CURRENT ASSETS",
    "Breeding Stock": "LONG-TERM ASSETS",
    "Operating Notes": "CURRENT LIABILITIES",
    "RE Mortgages (LT)": "LONG-TERM LIABILITIES",
    "WORKING CAPITAL": "SUMMARY"
  };
  const BOLD_ROWS = new Set(["Total Current Assets","Total LT Assets","TOTAL ASSETS","Total Current Liab","TOTAL LIABILITIES","WORKING CAPITAL","NET WORTH"]);

  function sheetTotals(d) {
    if (!d) return {};
    const m = numVal;
    const cash = m(d.cashGlacier) + (d.cashOther||[]).reduce((s,r)=>s+m(r.amount),0);
    const rec = (d.receivables||[]).reduce((s,r)=>s+m(r.amount),0);
    const fp = (d.farmProducts||[]).reduce((s,r)=>s+m(r.quantity)*m(r.pricePerUnit)*(m(r.share||"100")/100),0);
    const ci = (d.cropInvestment||[]).reduce((s,r)=>s+m(r.acres)*m(r.valuePerAcre),0);
    const ls = (d.livestockMarket||[]).reduce((s,r)=>s+m(r.value),0);
    const sup = (d.supplies||[]).reduce((s,r)=>s+m(r.value),0);
    const oc = (d.otherCurrent||[]).reduce((s,r)=>s+m(r.amount),0);
    const fedP = Array.isArray(d.federalPayments)
      ? (d.federalPayments||[]).reduce((s,r)=>s+m(r.amount),0)
      : m(d.federalPayments||"");
    const tc = cash+rec+fedP+ls+fp+ci+sup+oc;
    const bs = (d.breedingStock||[]).reduce((s,r)=>s+m(r.value),0);
    const re = (d.realEstate||[]).reduce((s,r)=>s+m(r.acres)*m(r.valuePerAcre),0);
    const veh = (d.vehicles||[]).reduce((s,r)=>s+m(r.value),0);
    const mach = (d.machinery||[]).reduce((s,r)=>s+m(r.value),0);
    const oa = (d.otherAssets||[]).reduce((s,r)=>s+m(r.amount),0);
    const tlt = bs+re+(d.reContracts||[]).reduce((s,r)=>s+m(r.amount),0)+veh+mach+oa;
    const ta = tc+tlt;
    const on = (d.operatingNotes||[]).reduce((s,r)=>s+m(r.balance),0);
    const ad = (d.accountsDue||[]).reduce((s,r)=>s+m(r.amount),0);
    const id = (d.intermediatDebt||[]).reduce((s,r)=>s+m(r.annualPmt),0);
    const idLT = (d.intermediatDebt||[]).reduce((s,r)=>s+Math.max(0,m(r.principal)-m(r.annualPmt)),0);
    const rc = (d.reCurrent||[]).reduce((s,r)=>s+m(r.annualPmt),0);
    const ocl = (d.otherCurrentLiab||[]).reduce((s,r)=>s+m(r.amount),0);
    const tcl = on+ad+id+rc+m(d.taxesDue)+ocl;
    const rm = (d.reMortgages||[]).reduce((s,r)=>s+m(r.principal),0);
    const ol = (d.otherLiabilities||[]).reduce((s,r)=>s+m(r.balance),0);
    const tl = tcl+idLT+rm+ol;
    return {
      "Cash & Bank":cash, "Receivables":rec, "Federal Payments":m(d.federalPayments),
      "Market Livestock":ls, "Farm Products":fp, "Crop Investment":ci,
      "Supplies":sup, "Other Current":oc, "Total Current Assets":tc,
      "Breeding Stock":bs, "Real Estate":re,
      "RE Contracts Rec.":(d.reContracts||[]).reduce((s,r)=>s+m(r.amount),0),
      "Titled Vehicles":veh, "Machinery & Equip.":mach, "Other Assets":oa,
      "Total LT Assets":tlt, "TOTAL ASSETS":ta,
      "Operating Notes":on, "Accounts Due":ad, "Intermediate Debt (current)":id,
      "RE Mortgage (current)":rc, "Income Taxes Due":m(d.taxesDue),
      "Other Current Liab":ocl, "Total Current Liab":tcl,
      "Intermediate Debt (LT)":idLT,
      "RE Mortgages (LT)":rm, "Other Liabilities":ol,
      "TOTAL LIABILITIES":tl, "WORKING CAPITAL":tc-tcl, "NET WORTH":ta-tl
    };
  }

  // Load linked entity net worths using sheetTotals (must be after sheetTotals is defined)
  useEffect(() => {
    async function fetchAllLinkedNW() {
      const entities = data.linkedEntities || [];
      if (!entities.length) { setLinkedEntityNWMap({}); return; }
      const newMap = {};
      for (const name of entities) {
        try {
          const prefix = STORAGE_PREFIX + name.replace(/\s+/g,"_") + ":";
          const result = await storage.list(prefix);
          if (result && result.keys && result.keys.length > 0) {
            const sorted = result.keys.sort((a,b) => b.localeCompare(a));
            const item = await storage.get(sorted[0]);
            if (item) {
              const p = JSON.parse(item.value);
              const totals = sheetTotals(p);
              newMap[name] = totals["NET WORTH"] || 0;
            }
          }
        } catch {}
      }
      setLinkedEntityNWMap(newMap);
    }
    fetchAllLinkedNW();
  }, [JSON.stringify(data.linkedEntities), savedSheets.length]);


  const loadComparisonSheets = async () => {
    if (!data.clientName) return;
    setCompLoading(true); setCompInsight("");
    try {
      const prefix = STORAGE_PREFIX + data.clientName.replace(/\s+/g,"_") + ":";
      const result = await storage.list(prefix);
      if (result && result.keys && result.keys.length > 0) {
        const sheets = [];
        for (const key of result.keys) {
          try {
            const item = await storage.get(key);
            if (item) {
              const p = JSON.parse(item.value);
              sheets.push({ date: p.asOfDate, totals: sheetTotals(p) });
            }
          } catch {}
        }
        sheets.sort((a,b) => a.date.localeCompare(b.date));
        setCompSheets(sheets);
      } else { setCompSheets([]); }
    } catch {}
    setCompLoading(false);
  };

  const generateInsights = async () => {
    if (compSheets.length < 2) return;
    setCompInsightLoading(true); setCompInsight("");
    const years = compSheets.map(s => s.date).join(", ");
    const rows = Object.keys(compSheets[0].totals).map(label => {
      const vals = compSheets.map(s => s.totals[label] || 0);
      return vals.slice(1).map((v,i) => {
        const prev = vals[i];
        const diff = v - prev;
        const pct = prev !== 0 ? ((diff/Math.abs(prev))*100).toFixed(1) : "N/A";
        const prevStr = prev >= 0 ? "$"+prev.toLocaleString() : "-$"+Math.abs(prev).toLocaleString();
        return label + ": " + prevStr + " to $" + v.toLocaleString() + " (" + (diff>=0?"+":"") + diff.toLocaleString() + ", " + pct + "%)";
      }).join("; ");
    }).join("\n");
    try {
      // Call our Netlify proxy function (avoids CORS + keeps API key private)
      const apiEndpoint = '/.netlify/functions/analyze';

      const requestBody = {
        model: "claude-sonnet-4-5",
        max_tokens: 1000,
        system: "You are an agricultural loan officer analyst at First Bank of Montana. "
          + "Analyze year-over-year balance sheet changes and provide clear practical insights. "
          + "Focus on significant changes, trends, working capital, debt load, and net worth. "
          + "Write in plain language. Use simple headers. Max 5 key observations.",
        messages: [{
          role: "user",
          content: "Client: " + data.clientName + "\nYears: " + years
            + "\n\nChanges:\n" + rows
            + "\n\nProvide insights on the most significant changes and financial health."
        }]
      };

      const resp = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      if (!resp.ok) {
        const errText = await resp.text();
        setCompInsight("Error from server (" + resp.status + "): " + errText);
        setCompInsightLoading(false);
        return;
      }
      const json = await resp.json();
      const text = json.content?.filter(b=>b.type==="text").map(b=>b.text).join("")
        || json.error
        || "Unable to generate insights.";
      setCompInsight(text);
    } catch (err) {
      setCompInsight("Connection error: " + err.message + ". Check that ANTHROPIC_API_KEY is set in Netlify environment variables.");
    }
    setCompInsightLoading(false);
  };


  // ── Move sheet to a different folder ────────────────────────────────────────
  const moveSheet = async (key, newFolderPath) => {
    try {
      const item = await storage.get(key);
      if (!item) return;
      const p = JSON.parse(item.value);
      p.folderPath = newFolderPath;
      p._savedAt = new Date().toISOString();
      await storage.set(key, JSON.stringify(p));
      // If this is the currently open sheet, update data too
      if (data.clientName === p.clientName && data.asOfDate === p.asOfDate) {
        set("folderPath", newFolderPath);
      }
      await loadSavedList();
      setShowMoveModal(null);
    } catch {}
  };

  // ── Build folder tree from saved sheets ─────────────────────────────────────
  function buildFolderTree(sheets) {
    const tree = {};
    sheets.forEach(s => {
      const path = s.folderPath || [];
      let node = tree;
      // Build nested structure
      path.forEach(segment => {
        if (!node[segment]) node[segment] = { _children: {}, _sheets: [] };
        node = node[segment]._children;
      });
      // Find the leaf node for this path
      let leaf = tree;
      path.forEach(seg => { leaf = leaf[seg]._children; });
      // Add sheet to parent (one level up from _children)
      let parent = tree;
      for (let i = 0; i < path.length - 1; i++) parent = parent[path[i]]._children;
      if (path.length === 0) {
        if (!tree._unfiledSheets) tree._unfiledSheets = [];
        tree._unfiledSheets.push(s);
      } else {
        const lastSeg = path[path.length - 1];
        let parentNode = tree;
        for (let i = 0; i < path.length - 1; i++) parentNode = parentNode[path[i]]._children;
        if (!parentNode[lastSeg]) parentNode[lastSeg] = { _children: {}, _sheets: [] };
        parentNode[lastSeg]._sheets.push(s);
      }
    });
    return tree;
  }

  // ── Collect all folder paths in use ─────────────────────────────────────────
  function getAllFolderPaths(sheets) {
    const pathSet = new Set();
    pathSet.add("");
    sheets.forEach(s => {
      const path = s.folderPath || [];
      for (let i = 1; i <= path.length; i++) {
        pathSet.add(JSON.stringify(path.slice(0, i)));
      }
    });
    // Also include user-created standalone folders
    userFolders.forEach(path => {
      for (let i = 1; i <= path.length; i++) {
        pathSet.add(JSON.stringify(path.slice(0, i)));
      }
    });
    return [...pathSet].map(p => p ? JSON.parse(p) : []);
  }


  const renameFolder = async (oldPath, newName) => {
    if (!newName.trim() || newName.trim() === oldPath[oldPath.length-1]) {
      setEditingFolder(null);
      return;
    }
    const newPath = [...oldPath.slice(0, -1), newName.trim()];
    const oldKey = JSON.stringify(oldPath);
    const newKey = JSON.stringify(newPath);

    // Update userFolders - rename this folder and all children that start with oldPath
    const updatedFolders = userFolders.map(f => {
      const fKey = JSON.stringify(f.slice(0, oldPath.length));
      if (fKey === oldKey) return [...newPath, ...f.slice(oldPath.length)];
      return f;
    });
    setUserFolders(updatedFolders);
    try { localStorage.setItem("fbmt_userFolders", JSON.stringify(updatedFolders)); } catch {}

    // Update all saved sheets that have this folder in their path
    try {
      const result = await storage.list(STORAGE_PREFIX);
      if (result && result.keys) {
        for (const key of result.keys) {
          try {
            const item = await storage.get(key);
            if (!item) continue;
            const p = JSON.parse(item.value);
            const fp = p.folderPath || [];
            if (fp.length >= oldPath.length &&
                JSON.stringify(fp.slice(0, oldPath.length)) === oldKey) {
              p.folderPath = [...newPath, ...fp.slice(oldPath.length)];
              await storage.set(key, JSON.stringify(p));
            }
          } catch {}
        }
      }
    } catch {}

    // If currently open sheet is in this folder, update it
    if (data.folderPath && JSON.stringify(data.folderPath.slice(0, oldPath.length)) === oldKey) {
      set("folderPath", [...newPath, ...data.folderPath.slice(oldPath.length)]);
    }

    await loadSavedList();
    setEditingFolder(null);
  };

  // ── Corp Personal Debt Loader ──────────────────────────────────────────────
  const lookupPrice = (name) => {
    if (!name) return null;
    const needle = name.toLowerCase().trim();
    const match = commodityPrices.find(p =>
      needle.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(needle)
    );
    return match ? match.price : null;
  };

  const generateBSShare = async () => {
    setBSShareStatus('generating'); setShowBSShareModal(true);
    try {
      const shareId = Math.random().toString(36).slice(2,10).toUpperCase();
      const pin = String(Math.floor(100000 + Math.random() * 900000));
      const expires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const payload = { share_id:shareId, pin, client_name:data.clientName, as_of_date:data.asOfDate, user_id:currentSession?.user?.id||null, original_data:data, expires_at:expires };
      const resp = await fetch(SUPABASE_URL+'/rest/v1/balance_sheet_shares', { method:'POST', headers:supaHeaders(), body:JSON.stringify(payload) });
      if (!resp.ok) throw new Error(await resp.text());
      setBSShareLink(window.location.origin+'/?bs='+shareId);
      setBSSharePin(pin); setBSShareStatus('ready');
    } catch(e) { setBSShareStatus('error:'+e.message); }
  };

  const generateBudgetShare = async () => {
    setBudgetShareStatus('generating'); setShowBudgetShareModal(true);
    try {
      const shareId = Math.random().toString(36).slice(2,10).toUpperCase();
      const pin = String(Math.floor(100000 + Math.random() * 900000));
      const expires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const payload = { share_id:shareId, pin, client_name:data.clientName, as_of_date:data.asOfDate, user_id:currentSession?.user?.id||null, original_data:{}, expires_at:expires };
      const resp = await fetch(SUPABASE_URL+'/rest/v1/budget_shares', { method:'POST', headers:supaHeaders(), body:JSON.stringify(payload) });
      if (!resp.ok) throw new Error(await resp.text());
      setBudgetShareLink(window.location.origin+'/?budget='+shareId);
      setBudgetSharePin(pin); setBudgetShareStatus('ready');
    } catch(e) { setBudgetShareStatus('error:'+e.message); }
  };

  const loadPendingReviews = async () => {
    if (!isConfigured()) return;
    setLoadingReviews(true);
    try {
      const [bsResp, budResp] = await Promise.all([
        fetch(SUPABASE_URL+'/rest/v1/balance_sheet_shares?status=eq.submitted&select=share_id,client_name,as_of_date,submitted_at,customer_draft,original_data&order=submitted_at.desc', {headers:supaHeaders()}),
        fetch(SUPABASE_URL+'/rest/v1/budget_shares?status=eq.submitted&select=share_id,client_name,as_of_date,submitted_at,customer_draft&order=submitted_at.desc', {headers:supaHeaders()}),
      ]);
      const bsRows = bsResp.ok ? await bsResp.json() : [];
      const budRows = budResp.ok ? await budResp.json() : [];
      setPendingReviews([
        ...bsRows.map(r=>({...r,type:'balance_sheet'})),
        ...budRows.map(r=>({...r,type:'budget'})),
      ].sort((a,b)=>b.submitted_at?.localeCompare(a.submitted_at||'')||0));
    } catch {}
    setLoadingReviews(false);
  };

  const markReviewed = async (shareId, type) => {
    const table = type==='balance_sheet'?'balance_sheet_shares':'budget_shares';
    await fetch(SUPABASE_URL+`/rest/v1/${table}?share_id=eq.`+shareId, { method:'PATCH', headers:supaHeaders(), body:JSON.stringify({status:'reviewed'}) });
    setPendingReviews(p=>p.filter(r=>r.share_id!==shareId));
  };

  const loadBSReview = async (review, saveDate) => {
    if (!review.customer_draft && !review.original_data) return;
    const d = {...emptyData(),...(review.original_data||{}),...(review.customer_draft||{})};
    d.asOfDate = saveDate || review.as_of_date || new Date().toISOString().slice(0,10);
    setData(d); setStep(0); setScreen('wizard');
    await markReviewed(review.share_id,'balance_sheet');
  };

  const loadBudgetReview = async (review, saveDate) => {
    if (!review.customer_draft) return;
    const d = {...data, ...review.customer_draft};
    d.asOfDate = saveDate || review.as_of_date || new Date().toISOString().slice(0,10);
    setData(d); setActiveTab('budget'); setScreen('wizard');
    await markReviewed(review.share_id,'budget');
  };

  const updateCommodityPrice = (id, field, value) => {
    const updated = commodityPrices.map(p => p.id === id ? {...p, [field]: value} : p);
    setCommodityPrices(updated);
    saveCommodityPrices(updated);
  };

  const loadCorpPersonalDebt = async () => {
    if (!data.clientName) return;
    try {
      const result = await storage.list(STORAGE_PREFIX);
      if (!result || !result.keys) return;
      const corpDebts = [];
      for (const key of result.keys) {
        try {
          const item = await storage.get(key);
          if (!item) continue;
          const p = JSON.parse(item.value);
          // Only sheets linked to this client
          const linkedArr = Array.isArray(p.linkedEntities) ? p.linkedEntities : (p.linkedEntity ? [p.linkedEntity] : []);
          if (!linkedArr.some(e => e.trim().toLowerCase() === data.clientName.trim().toLowerCase())) continue;
          const ownerName = p.clientName || "Unknown";
          // Corp-paid term debt
          (p.intermediatDebt || []).forEach(r => {
            if (r.corpPaid && r.creditor && numVal(r.annualPmt) > 0) {
              corpDebts.push({ creditor: r.creditor, security: r.security || "", annualPmt: r.annualPmt, owner: ownerName, type: "term" });
            }
          });
          // Corp-paid RE current portion
          (p.reCurrent || []).forEach(r => {
            if (r.corpPaid && r.creditor && numVal(r.annualPmt) > 0) {
              corpDebts.push({ creditor: r.creditor, security: "", annualPmt: r.annualPmt, owner: ownerName, type: "re" });
            }
          });
        } catch {}
      }
      setCorpPersonalDebt(corpDebts);
    } catch { setCorpPersonalDebt([]); }
  };

  const handlePrint = () => {
    const m = numVal;
    const pFmt = v => v && m(v) ? "$"+Number(m(v)).toLocaleString("en-US",{maximumFractionDigits:0}) : "";
    const blank = (arr, min) => { const r=[...arr]; while(r.length<min) r.push({}); return r; };
    const W = window.open("","_blank","width=850,height=1100");
    if (!W) return;
    const html = `<!DOCTYPE html><html><head><title>Balance Sheet - ${data.clientName}</title>
<style>
body{font-family:Arial,sans-serif;font-size:7.5pt;color:#000;margin:.45in .4in;}
h1{font-size:13pt;font-weight:700;text-decoration:underline;text-align:center;margin-bottom:4pt;}
h2{font-size:11pt;font-weight:700;text-decoration:underline;text-align:center;margin-bottom:8pt;}
.logo-box{border:2pt solid #6B0E1E;padding:4pt 7pt;display:inline-block;text-align:center;font-weight:900;color:#6B0E1E;}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6pt;}
.name-row{border-bottom:1pt solid #000;padding-bottom:3pt;margin-bottom:5pt;font-weight:700;}
.body{display:flex;gap:8pt;}
.col{flex:1;}
.col-head{background:#000;color:#fff;font-weight:700;font-size:8pt;text-align:center;padding:2pt 4pt;display:flex;justify-content:space-between;}
.sec{font-style:italic;font-size:7pt;margin:3pt 0 1pt;color:#333;}
.row{display:flex;justify-content:space-between;min-height:12pt;border-bottom:.5pt dotted #ccc;padding:.5pt 2pt;}
.trow{display:flex;min-height:11pt;border-bottom:.5pt dotted #ccc;font-size:7pt;padding:.5pt 0;}
.c1{flex:1.4;} .c2{flex:1;} .c3{flex:.8;text-align:right;} .c4{flex:.8;text-align:right;} .c5{flex:.9;text-align:right;font-weight:600;}
.th{font-weight:700;font-size:6pt;text-transform:uppercase;border-bottom:1pt solid #000;margin-bottom:1pt;}
.subtot{display:flex;justify-content:space-between;border-top:1pt solid #000;padding-top:2pt;margin:2pt 0;font-weight:700;font-size:8pt;}
.tot{display:flex;justify-content:space-between;background:#000;color:#fff;padding:2pt 4pt;font-weight:700;font-size:8.5pt;margin:3pt 0;}
.net{display:flex;justify-content:space-between;border:1.5pt solid #000;padding:2pt 4pt;font-weight:700;font-size:8.5pt;margin:2pt 0;}
.sig{margin-top:10pt;border-top:1pt solid #000;padding-top:6pt;font-size:7pt;}
.sig-row{display:flex;gap:20pt;margin-top:8pt;}
.sig-line{flex:1;border-top:1pt solid #000;padding-top:2pt;}
.page2{page-break-before:always;padding-top:.2in;}
.sched-title{font-size:10pt;font-weight:700;text-transform:uppercase;letter-spacing:.05em;border-bottom:2pt solid #000;padding-bottom:3pt;margin-bottom:6pt;}
.sched-table{width:100%;border-collapse:collapse;font-size:7.5pt;margin-bottom:16pt;}
.sched-table th{background:#000;color:#fff;padding:3pt 5pt;text-align:left;font-size:7pt;font-weight:700;}
.sched-table th.r{text-align:right;}
.sched-table td{padding:3pt 5pt;border-bottom:.5pt dotted #ccc;vertical-align:top;}
.sched-table td.r{text-align:right;font-weight:600;}
.sched-table tr:nth-child(even){background:#f8f8f8;}
.sched-foot{display:flex;justify-content:flex-end;margin-top:4pt;}
.sched-total{background:#000;color:#fff;padding:2pt 8pt;font-weight:700;font-size:8pt;}
.sched-hdr{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4pt;}
.sched-client{font-size:8pt;color:#555;}
</style></head><body>
<div class="hdr">
  <div class="logo-box">FIRST<br/>BANK<br/>of Montana<br/><small>www.1stbmt.com</small></div>
  <div><h1>Balance Sheet prepared for:</h1><h2>First Bank of Montana</h2></div>
  <div style="text-align:right"><strong>As of:</strong> ${data.asOfDate}</div>
</div>
<div class="name-row">Name: ${data.clientName}</div>
<div class="body">
<div class="col">
<div class="col-head"><span>ASSETS</span><span>AMOUNT</span></div>
<div class="row"><span>Cash on Hand and in Bank:</span><span>${pFmt(cashTotal)||"$0"}</span></div>
<div class="sec">Current Receivables:</div>
${blank(data.receivables.filter(r=>r.description||r.amount),2).map(r=>`<div class="row"><span>${r.description||""}</span><span>${pFmt(r.amount)}</span></div>`).join("")}
${(Array.isArray(data.federalPayments)?data.federalPayments:[{program:"Federal Payments",amount:data.federalPayments}]).filter(r=>r.amount&&numVal(r.amount)>0).map(r=>`<div class="row"><span>${r.program||"Federal Payments"}</span><span>${pFmt(r.amount)}</span></div>`).join("")}
<div class="sec">Farm Products:</div>
<div class="trow th"><span class="c1">Qty/Unit</span><span class="c2">Kind</span><span class="c3">Price/Unit</span><span class="c5">Total Value</span></div>
${blank(data.farmProducts.filter(r=>r.kind),3).map(r=>{const sh=numVal(r.share||"100");const val=numVal(r.quantity)*numVal(r.pricePerUnit)*(sh/100);const tags=[];if(sh<100)tags.push(sh+"% share");if(r.contracted)tags.push("contracted");return`<div class="trow"><span class="c1">${r.quantity?r.quantity+" "+r.unit:""}</span><span class="c2">${r.kind||""}${tags.length?" ("+tags.join(", ")+")":""}</span><span class="c3">${r.pricePerUnit?"$"+r.pricePerUnit+"/"+r.unit:""}</span><span class="c5">${pFmt(val)}</span></div>`;}).join("")}
<div class="sec">Growing Crops:</div>
${blank(data.cropInvestment.filter(r=>r.cropType),2).map(r=>`<div class="trow"><span class="c1">${r.cropType||""}</span><span class="c2">${r.acres?" acres: "+r.acres:""}</span><span class="c5">${pFmt(numVal(r.acres)*numVal(r.valuePerAcre))}</span></div>`).join("")}
<div class="subtot"><span>TOTAL CURRENT ASSETS:</span><span>${pFmt(totalCurrentAssets)||"$0"}</span></div>
<div class="sec">Breeding Stock:</div>
${blank(data.breedingStock.filter(r=>r.kind),3).map(r=>`<div class="trow"><span class="c1">${r.number||""}</span><span class="c2">${r.kind||""}</span><span class="c5">${pFmt(r.value)}</span></div>`).join("")}
<div class="sec">Real Estate:</div>
<div class="trow th"><span class="c1">Acres</span><span class="c2">Type</span><span class="c3">$/Acre</span><span class="c5">Total Value</span></div>
${blank(data.realEstate.filter(r=>r.reType||r.acres),3).map(r=>`<div class="trow"><span class="c1">${r.acres?r.acres+" ac":""}</span><span class="c2">${r.reType||""}</span><span class="c3">${r.valuePerAcre?"$"+r.valuePerAcre+"/ac":""}</span><span class="c5">${pFmt(numVal(r.acres)*numVal(r.valuePerAcre))}</span></div>`).join("")}
<div class="row"><span>Titled Vehicles: (see schedule pg. 2)</span><span>${pFmt(vehiclesVal)}</span></div>
<div class="row"><span>Machinery and Equipment: (see schedule pg. 2)</span><span>${pFmt(machVal)}</span></div>
<div class="tot"><span>TOTAL ASSETS</span><span>${pFmt(totalAssets)||"$0"}</span></div>
</div>
<div class="col">
<div class="col-head"><span>LIABILITIES</span><span>PMT / BALANCE</span></div>
<div class="sec">Operating Notes:</div>
<div class="trow th"><span class="c1">Creditor</span><span class="c3">Due</span><span class="c4">Pmt</span><span class="c5">Balance</span></div>
${blank(data.operatingNotes.filter(r=>r.creditor),4).map(r=>`<div class="trow"><span class="c1">${r.creditor||""}</span><span class="c3">${r.dueDate||""}</span><span class="c4">${pFmt(r.pmt)}</span><span class="c5">${pFmt(r.balance)}</span></div>`).join("")}
<div class="sec">Accounts Due:</div>
${blank(data.accountsDue.filter(r=>r.creditor),2).map(r=>`<div class="row"><span>${r.creditor||""}</span><span>${pFmt(r.amount)}</span></div>`).join("")}
<div class="sec">Intermediate Term Debt:</div>
<div class="trow th"><span class="c1">Creditor</span><span class="c2">Security</span><span class="c4">Ann.Pmt</span><span class="c5">Principal</span></div>
${blank(data.intermediatDebt.filter(r=>r.creditor),4).map(r=>`<div class="trow"><span class="c1">${r.creditor||""}</span><span class="c2">${r.security||""}</span><span class="c3">${r.rate?r.rate+"%":""}</span><span class="c4">${pFmt(r.annualPmt)}</span><span class="c5">${pFmt(r.principal)}</span></div>`).join("")}
<div class="sec">Current RE Mortgage Portion:</div>
${blank(data.reCurrent.filter(r=>r.creditor),2).map(r=>`<div class="row"><span>${r.creditor||""}</span><span>${pFmt(r.annualPmt)}</span></div>`).join("")}
<div class="row"><span>Income Taxes Due:</span><span>${pFmt(data.taxesDue)}</span></div>
<div class="subtot"><span>TOTAL CURRENT LIABILITIES:</span><span>${pFmt(totalCurrentLiab)||"$0"}</span></div>
<div class="sec">RE Mortgages (long-term):</div>
${blank(data.reMortgages.filter(r=>r.lienHolder),3).map(r=>`<div class="trow"><span class="c1">${r.lienHolder||""}</span><span class="c2">${r.terms||""}</span><span class="c3">${r.rate?r.rate+"%":""}</span><span class="c5">${pFmt(r.principal)}</span></div>`).join("")}
<div class="tot"><span>TOTAL LIABILITIES</span><span>${pFmt(totalLiabilities)||"$0"}</span></div>
<div class="net"><span>WORKING CAPITAL</span><span>${pFmt(workingCapital)||"$0"}</span></div>
<div class="net"><span>NET WORTH</span><span>${pFmt(netWorth)||"$0"}</span></div>
</div>
</div>
<div class="sig">
<p>For the purpose of obtaining credit from time to time with the Bank, the following statement and information are furnished as complete, true, and accurate statement of the financial condition of the undersigned on the below date. All amounts are rounded to the nearest $100.00</p>
<div class="sig-row">
  <div class="sig-line">Signature: _______________________________________________</div>
  <div class="sig-line">Signature: _______________________________________________</div>
</div>
<div class="sig-row" style="margin-top:10pt">
  <div class="sig-line">Date: ____________________________________________________</div>
  <div class="sig-line">Date: ____________________________________________________</div>
</div>
</div>

<!-- ═══ PAGE 2 — SCHEDULES ═══════════════════════════════════════════════ -->
<div class="page2">
<div class="hdr">
  <div class="logo-box">FIRST<br/>BANK<br/>of Montana<br/><small>www.1stbmt.com</small></div>
  <div style="flex:1;padding-left:16pt">
    <div style="font-size:11pt;font-weight:700;text-decoration:underline;">Balance Sheet Supplement — Schedules</div>
    <div style="font-size:8pt;margin-top:3pt;">Name: ${data.clientName} &nbsp;&nbsp; As of: ${data.asOfDate}</div>
  </div>
</div>

<div class="sched-title">Titled Vehicles Schedule</div>
<table class="sched-table">
  <thead><tr>
    <th style="width:8%">Year</th>
    <th style="width:32%">Make and Model</th>
    <th style="width:25%">VIN</th>
    <th style="width:15%">Condition</th>
    <th class="r" style="width:20%">Value</th>
  </tr></thead>
  <tbody>
    ${(data.vehicles.length ? data.vehicles : [{year:"",make:"",vin:"",condition:"",value:""}]).map(r=>`<tr><td>${r.year||""}</td><td>${r.make||""}</td><td style="font-size:6.5pt">${r.vin||""}</td><td>${r.condition||""}</td><td class="r">${pFmt(r.value)}</td></tr>`).join("")}
  </tbody>
</table>
<div class="sched-foot"><div class="sched-total">TOTAL TITLED VEHICLES: ${pFmt(vehiclesVal)||"$0"}</div></div>

<div class="sched-title" style="margin-top:18pt">Farm Machinery and Equipment Schedule</div>
<table class="sched-table">
  <thead><tr>
    <th style="width:7%">Year</th>
    <th style="width:30%">Make and Model</th>
    <th style="width:12%">Size</th>
    <th style="width:18%">Serial Number</th>
    <th style="width:13%">Condition</th>
    <th class="r" style="width:20%">Value</th>
  </tr></thead>
  <tbody>
    ${(data.machinery.length ? data.machinery : [{year:"",make:"",size:"",serial:"",condition:"",value:""}]).map(r=>`<tr><td>${r.year||""}</td><td>${r.make||""}</td><td>${r.size||""}</td><td style="font-size:6.5pt">${r.serial||""}</td><td>${r.condition||""}</td><td class="r">${pFmt(r.value)}</td></tr>`).join("")}
  </tbody>
</table>
<div class="sched-foot"><div class="sched-total">TOTAL MACHINERY AND EQUIPMENT: ${pFmt(machVal)||"$0"}</div></div>
</div>

</body></html>`;
    W.document.write(html);
    W.document.close();
    W.focus();
    setTimeout(() => W.print(), 400);
  };

  const handlePrintBudget = () => {
    const corpPDTotal = corpPersonalDebt.filter(r=>r.annualPmt&&numVal(r.annualPmt)>0).reduce((s,r)=>s+numVal(r.annualPmt),0);
    const totalExp = budgetTotalExpenses + corpPDTotal;
    const netInc = budgetTotalIncome - totalExp;
    const W = window.open("","_blank","width=850,height=1100");
    if (!W) return;
    const cropRows = data.budgetCrops.filter(r=>r.crop||r.acres).map(r=>{
      const rv = numVal(r.acres)*numVal(r.yieldPerAcre)*numVal(r.price)*(numVal(r.share||"100")/100);
      return "<tr><td>"+r.crop+"</td><td class='r'>"+r.acres+"</td><td class='r'>"+r.yieldPerAcre+" "+r.unit+"</td><td class='r'>$"+numVal(r.price).toFixed(2)+"</td><td class='r'>"+r.share+"%"+(r.contracted?" C":"")+"</td><td class='r'>$"+Math.round(rv).toLocaleString()+"</td></tr>";
    }).join("");
    const lsRows = data.budgetLivestock.filter(r=>r.type||r.head).map(r=>{
      const rv = numVal(r.head)*numVal(r.lbs)*numVal(r.price);
      return "<tr><td>"+r.type+"</td><td class='r'>"+r.head+"</td><td class='r'>"+r.lbs+" lbs</td><td class='r'>$"+numVal(r.price).toFixed(2)+"/lb</td><td class='r'></td><td class='r'>$"+Math.round(rv).toLocaleString()+"</td></tr>";
    }).join("");
    const miscRows = data.budgetMisc.filter(r=>r.description||r.amount).map(r=>
      "<tr><td colspan='5'>"+r.description+"</td><td class='r'>$"+Math.round(numVal(r.amount)).toLocaleString()+"</td></tr>"
    ).join("");
    const expRows = data.budgetExpenses.filter(r=>r.description||r.amount).map(r=>
      "<tr><td colspan='5'>"+r.description+"</td><td class='r'>$"+Math.round(numVal(r.amount)).toLocaleString()+"</td></tr>"
    ).join("");
    const debtPersonalRows = [...debtServiceTermsPersonal,...debtServiceREPersonal].map(r=>
      "<tr><td colspan='5'>"+r.creditor+(r.security?" ("+r.security+")":"")+"</td><td class='r'>$"+Math.round(numVal(r.annualPmt)).toLocaleString()+"</td></tr>"
    ).join("");
    const debtCorpRows = [...debtServiceTermsCorp,...debtServiceRECorp].map(r=>
      "<tr><td colspan='5'>"+r.creditor+(r.security?" ("+r.security+")":"")+" <em style='color:#2d5a8e'>(corp pays)</em></td><td class='r' style='color:#2d5a8e'>$"+Math.round(numVal(r.annualPmt)).toLocaleString()+"</td></tr>"
    ).join("");
    const personalDebtRows = corpPersonalDebt.filter(r=>r.annualPmt&&numVal(r.annualPmt)>0).map(r=>
      "<tr><td colspan='5'>"+r.creditor+" <em style='color:#7a4f00'>("+r.owner+")</em></td><td class='r' style='color:#7a4f00'>$"+Math.round(numVal(r.annualPmt)).toLocaleString()+"</td></tr>"
    ).join("");
    const html = "<!DOCTYPE html><html><head><title>Budget - "+data.clientName+"</title><style>"
      +"body{font-family:Arial,sans-serif;font-size:8pt;margin:.45in .4in;color:#000;}"
      +"h1{font-size:13pt;font-weight:700;text-decoration:underline;text-align:center;margin-bottom:2pt;}"
      +"h2{font-size:11pt;font-weight:700;text-align:center;margin-bottom:6pt;}"
      +".hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8pt;}"
      +".logo{border:2pt solid #6B0E1E;padding:3pt 6pt;font-weight:900;color:#6B0E1E;font-size:8pt;text-align:center;}"
      +".name{border-bottom:1pt solid #000;padding-bottom:3pt;margin-bottom:6pt;font-weight:700;font-size:9pt;}"
      +".cols{display:flex;gap:10pt;}"
      +".col{flex:1;}"
      +".col-head{background:#000;color:#fff;font-weight:700;font-size:8pt;padding:2pt 5pt;margin-bottom:2pt;}"
      +".sec{font-style:italic;font-size:7pt;color:#555;margin:4pt 0 1pt;}"
      +"table{width:100%;border-collapse:collapse;font-size:7.5pt;margin-bottom:3pt;}"
      +"th{background:#333;color:#fff;padding:2pt 4pt;text-align:left;font-size:7pt;}"
      +"th.r{text-align:right;}td{padding:2pt 4pt;border-bottom:.5pt dotted #ddd;}"
      +"td.r{text-align:right;font-weight:600;}"
      +".subtot{display:flex;justify-content:space-between;border-top:1pt solid #000;padding-top:2pt;margin:2pt 0;font-weight:700;font-size:8pt;}"
      +".tot{display:flex;justify-content:space-between;background:#000;color:#fff;padding:2pt 5pt;font-weight:700;font-size:9pt;margin:3pt 0;}"
      +".net{display:flex;justify-content:space-between;padding:4pt 5pt;font-weight:700;font-size:10pt;margin-top:6pt;border:2pt solid #000;}"
      +"</style></head><body>"
      +"<div class='hdr'><div class='logo'>FIRST<br/>BANK<br/>of Montana</div>"
      +"<div><h1>Annual Agri-Business Budget</h1><h2>First Bank of Montana</h2></div>"
      +"<div style='text-align:right;font-size:8pt'><strong>Date:</strong> "+data.asOfDate+"</div></div>"
      +"<div class='name'>Name: "+data.clientName+"</div>"
      +"<div class='cols'>"
      // INCOME column
      +"<div class='col'>"
      +"<div class='col-head'>INCOME</div>"
      +(cropRows?"<div class='sec'>Crop Income</div><table><tr><th>Crop</th><th class='r'>Acres</th><th class='r'>Yield</th><th class='r'>Price</th><th class='r'>Share</th><th class='r'>Value</th></tr>"+cropRows+"</table><div class='subtot'><span>Crop Income</span><span>$"+Math.round(budgetCropTotal).toLocaleString()+"</span></div>":"")
      +(lsRows?"<div class='sec'>Livestock Income</div><table><tr><th>Type</th><th class='r'>Head</th><th class='r'>Wt</th><th class='r'>Price</th><th class='r'></th><th class='r'>Value</th></tr>"+lsRows+"</table><div class='subtot'><span>Livestock Income</span><span>$"+Math.round(budgetLivestockTotal).toLocaleString()+"</span></div>":"")
      +(miscRows?"<div class='sec'>Miscellaneous Income</div><table>"+miscRows+"</table><div class='subtot'><span>Misc Income</span><span>$"+Math.round(budgetMiscTotal).toLocaleString()+"</span></div>":"")
      +"<div class='tot'><span>TOTAL INCOME</span><span>$"+Math.round(budgetTotalIncome).toLocaleString()+"</span></div>"
      +"</div>"
      // EXPENSES column
      +"<div class='col'>"
      +"<div class='col-head'>EXPENSES</div>"
      +(expRows?"<div class='sec'>Operating Expenses</div><table>"+expRows+"</table><div class='subtot'><span>Total Operating</span><span>$"+Math.round(budgetOperatingExpenses).toLocaleString()+"</span></div>":"")
      +(debtPersonalRows?"<div class='sec'>Debt Service — Personal</div><table>"+debtPersonalRows+"</table>":"")
      +(debtCorpRows?"<div class='sec'>Debt Service — Corp Paid</div><table>"+debtCorpRows+"</table>":"")
      +((debtPersonalRows||debtCorpRows)?"<div class='subtot'><span>Total Own Debt Service</span><span>$"+Math.round(budgetTotalDebtService+budgetCorpDebtTotal).toLocaleString()+"</span></div>":"")
      +(personalDebtRows?"<div class='sec' style='color:#7a4f00'>Personal Debt Paid by This Entity</div><table>"+personalDebtRows+"</table><div class='subtot' style='color:#7a4f00'><span>Personal Debt Subtotal</span><span>$"+Math.round(corpPDTotal).toLocaleString()+"</span></div>":"")
      +"<div class='tot'><span>TOTAL EXPENSES</span><span>$"+Math.round(totalExp).toLocaleString()+"</span></div>"
      +"<div class='net' style='"+(netInc>=0?"background:#e8f5ea;":"background:#fce8e8;")+"'>"
      +"<span>"+(netInc>=0?"MARGIN (Net Income)":"MARGIN (Net Loss)")+"</span>"
      +"<span>$"+Math.round(Math.abs(netInc)).toLocaleString()+"</span></div>"
      +"</div>"
      +"</div>"
      +"</body></html>";
    W.document.write(html);
    W.document.close();
    W.focus();
    setTimeout(()=>W.print(), 400);
  };

  const currentStepId = STEPS[step];
  const progressPct = Math.round((step / (STEPS.length - 1)) * 100);
  const next = () => setStep(s => Math.min(s+1, STEPS.length-1));
  const prev = () => setStep(s => Math.max(s-1, 0));

  // ── Step Renderer ──────────────────────────────────────────────────────────
  function renderStep() {
    const CONDITIONS = ["— Select —","Cropland","Irrigated Cropland","Pasture / Rangeland","CRP","Timber","Home / Farmstead","Commercial","Vacant Lot","Other"];
    switch (currentStepId) {
      case "intro": return (
        <div className="step-content">
          <SecHdr icon="🏦" title="Client Balance Sheet" subtitle="First Bank of Montana — Agricultural Loan Package" />
          <p className="intro-text">Walk through the balance sheet section by section. Start with the client name and date.</p>
          <TxtInp label="Client Name" value={data.clientName} onChange={v=>set("clientName",v)} placeholder="Full name or entity name" />
          <div className="input-group">
            <label>As of Date</label>
            <input type="date" className="text-input" value={data.asOfDate} onChange={e=>set("asOfDate",e.target.value)} />
          </div>
        </div>
      );
      case "cash_glacier": return (
        <div className="step-content">
          <SecHdr icon="💰" title="Cash — Glacier Bank" subtitle="How much does the client have on deposit at Glacier Bank / First Bank of Montana?" />
          <Inp label="Glacier Bank balance" prefix="$" value={data.cashGlacier} onChange={v=>set("cashGlacier",v)} />
          <div className="subtotal-row"><span>Glacier Bank Total</span><strong>{fmt(data.cashGlacier)}</strong></div>
        </div>
      );
      case "cash_other": return (
        <div className="step-content">
          <SecHdr icon="🏧" title="Cash — Other Institutions" subtitle="Accounts at other banks, credit unions, or financial institutions" />
          {data.cashOther.map((r,i) => (
            <div key={i} className="row-entry" data-rowkey={`cashOther-${i}`}>
              <span className="row-num">{i+1}</span>
              <TxtInp label="Institution" value={r.institution} onChange={v=>setArr("cashOther",i,"institution",v)} placeholder="Bank name" />
              <Inp label="Balance" prefix="$" value={r.amount} onChange={v=>setArr("cashOther",i,"amount",v)} />
              <button className="remove-btn" onClick={()=>removeRow("cashOther",i)}>x</button>
            </div>
          ))}
          <button className="add-btn" onClick={()=>addRow("cashOther",{institution:"",amount:""})}>+ Add Institution</button>
          <div className="subtotal-row total">
            <span>Total Cash on Hand and in Bank</span>
            <strong>{fmt(cashTotal)}</strong>
          </div>
        </div>
      );
      case "receivables": return (
        <div className="step-content">
          <SecHdr icon="📋" title="Current Receivables" subtitle="Money owed to the client, collectible within 1 year" />
          {data.receivables.map((r,i) => (
            <div key={i} className="row-entry" data-rowkey={`receivables-${i}`}>
              <span className="row-num">{i+1}</span>
              <TxtInp label="Description" value={r.description} onChange={v=>setArr("receivables",i,"description",v)} placeholder="Who owes / for what" />
              <Inp label="Amount" prefix="$" value={r.amount} onChange={v=>setArr("receivables",i,"amount",v)} />
              <button className="remove-btn" onClick={()=>removeRow("receivables",i)}>x</button>
            </div>
          ))}
          <button className="add-btn" onClick={()=>addRow("receivables",{description:"",amount:""})}>+ Add Receivable</button>
          {recTotal > 0 && <TxtInp label="If secured, list type of security" value={data.receivablesSecured} onChange={v=>set("receivablesSecured",v)} placeholder="e.g., crops, equipment" />}
          <div className="subtotal-row"><span>Total Receivables</span><strong>{fmt(recTotal)}</strong></div>
        </div>
      );
      case "federal_payments": return (
        <div className="step-content">
          <SecHdr icon="🏛" title="Federal Payments Due" subtitle="FSA, ARC/PLC, CRP, CFAP, or other government payments expected" />
          {(Array.isArray(data.federalPayments) ? data.federalPayments : [{program:"",amount:""}]).map((r,i) => (
            <div key={i} className="row-entry" data-rowkey={"federalPayments-"+i}>
              <span className="row-num">{i+1}</span>
              <TxtInp label="Program" value={r.program}
                onChange={v=>setArr("federalPayments",i,"program",v)}
                placeholder="e.g., FSA ARC-CO, CRP, CFAP, PLC" />
              <Inp label="Amount" prefix="$" value={r.amount}
                onChange={v=>setArr("federalPayments",i,"amount",v)} />
              <button className="remove-btn"
                onClick={()=>removeRow("federalPayments",i)}>x</button>
            </div>
          ))}
          <button className="add-btn"
            onClick={()=>addRow("federalPayments",{program:"",amount:""})}>
            + Add Payment
          </button>
          <div className="subtotal-row total">
            <span>Total Federal Payments</span>
            <strong>{fmt(fedPay)}</strong>
          </div>
        </div>
      );
      case "livestock_market": return (
        <div className="step-content">
          <SecHdr icon="🐄" title="Market Livestock" subtitle="Livestock intended for sale — not breeding stock" />
          {data.livestockMarket.map((r,i) => (
            <div key={i} className="row-entry" data-rowkey={`livestockMarket-${i}`}>
              <span className="row-num">{i+1}</span>
              <TxtInp label="Number" value={r.number} onChange={v=>setArr("livestockMarket",i,"number",v)} placeholder="# head" />
              <TxtInp label="Kind and Weight" value={r.kind} onChange={v=>setArr("livestockMarket",i,"kind",v)} placeholder="e.g., 450 lb steers" />
              <Inp label="Value" prefix="$" value={r.value} onChange={v=>setArr("livestockMarket",i,"value",v)} />
              <button className="remove-btn" onClick={()=>removeRow("livestockMarket",i)}>x</button>
            </div>
          ))}
          <button className="add-btn" onClick={()=>addRow("livestockMarket",{number:"",kind:"",value:""})}>+ Add Livestock</button>
          <div className="subtotal-row"><span>Total Market Livestock</span><strong>{fmt(lsMktTotal)}</strong></div>
        </div>
      );
      case "farm_products": return (
        <div className="step-content">
          <SecHdr icon="🌾" title="Farm Products on Hand" subtitle="Grain, hay, silage in the bin, stack, or elevator. Qty x Price = Value." />
          <div className="fp-header-row">
            <span style={{width:20}}></span>
            <span className="fp-col-label" style={{width:90}}>Quantity</span>
            <span className="fp-col-label" style={{width:72}}>Unit</span>
            <span className="fp-col-label" style={{flex:1}}>Kind</span>
            <span className="fp-col-label" style={{width:105}}>Price/Unit</span>
            <span className="fp-col-label" style={{width:75}}>Share %</span>
            <span className="fp-col-label" style={{width:85,textAlign:"center"}}>Contracted</span>
            <span className="fp-col-label" style={{width:115}}>Your Value</span>
            <span style={{width:32}}></span>
          </div>
          {data.farmProducts.map((r,i) => {
            const share = numVal(r.share || "100");
            const rv = numVal(r.quantity) * numVal(r.pricePerUnit) * (share / 100);
            return (
              <div key={i} className="fp-row" data-rowkey={`farmProducts-${i}`}>
                <span className="row-num">{i+1}</span>
                <div className="input-group" style={{width:90,flexShrink:0}}>
                  <div className="input-wrap">
                    <input type="text" value={r.quantity} placeholder="0"
                      onChange={e=>setArr("farmProducts",i,"quantity",e.target.value.replace(/[^0-9.]/g,""))} />
                  </div>
                </div>
                <div className="input-group" style={{width:72,flexShrink:0}}>
                  <select className="unit-select" value={r.unit} onChange={e=>setArr("farmProducts",i,"unit",e.target.value)}>
                    <option>bu</option><option>ton</option><option>lbs</option>
                    <option>cwt</option><option>head</option><option>bale</option>
                  </select>
                </div>
                <div className="input-group" style={{flex:1}}>
                  <input className="text-input" type="text" value={r.kind}
                    placeholder="e.g., wheat, barley, hay"
                    onChange={e=>setArr("farmProducts",i,"kind",e.target.value)} />
                </div>
                <div className="input-group" style={{width:105,flexShrink:0}}>
                  <div className="input-wrap">
                    <span className="prefix">$</span>
                    <input type="text" value={r.pricePerUnit} placeholder="0.00"
                      onChange={e=>setArr("farmProducts",i,"pricePerUnit",e.target.value.replace(/[^0-9.]/g,""))} />
                  </div>
                </div>
                <div className="input-group" style={{width:75,flexShrink:0}}>
                  <div className="input-wrap">
                    <input type="text" value={r.share ?? "100"} placeholder="100"
                      onChange={e=>setArr("farmProducts",i,"share",e.target.value.replace(/[^0-9.]/g,""))} />
                    <span className="prefix" style={{borderLeft:"1.5px solid #ddd",borderRight:"none"}}>%</span>
                  </div>
                </div>
                <div style={{width:85,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  <input type="checkbox" id={"fp-con-"+i} checked={!!r.contracted}
                    onChange={e=>setArr("farmProducts",i,"contracted",e.target.checked)}
                    style={{width:16,height:16,accentColor:"#6B0E1E",cursor:"pointer"}} />
                  <label htmlFor={"fp-con-"+i} style={{fontSize:".75rem",color:"#555",cursor:"pointer"}}>
                    {r.contracted ? "Yes" : ""}
                  </label>
                </div>
                <CalcRow value={rv} style={{width:115}} />
                <button className="remove-btn" onClick={()=>removeRow("farmProducts",i)}>x</button>
              </div>
            );
          })}
          <button className="add-btn" onClick={()=>addRow("farmProducts",{quantity:"",kind:"",pricePerUnit:"",unit:"bu",share:"100",contracted:false})}>+ Add Farm Product</button>
          <div className="subtotal-row total"><span>Total Farm Products</span><strong>{fmt(farmProdTotal)}</strong></div>
        </div>
      );
      case "crop_investment": return (
        <div className="step-content">
          <SecHdr icon="🌱" title="Cash Investment — Growing Crops" subtitle="Input costs on crops not yet harvested. Acres x Value/Acre = Total." />
          <div className="fp-header-row">
            <span style={{width:20}}></span>
            <span className="fp-col-label" style={{flex:1}}>Crop Type</span>
            <span className="fp-col-label" style={{width:90}}>Acres</span>
            <span className="fp-col-label" style={{width:120}}>Value/Acre</span>
            <span className="fp-col-label" style={{width:115}}>Total</span>
            <span style={{width:32}}></span>
          </div>
          {data.cropInvestment.map((r,i) => {
            const rv = numVal(r.acres) * numVal(r.valuePerAcre);
            return (
              <div key={i} className="fp-row" data-rowkey={`cropInvestment-${i}`}>
                <span className="row-num">{i+1}</span>
                <div className="input-group" style={{flex:1}}>
                  <input className="text-input" type="text" value={r.cropType}
                    placeholder="e.g., winter wheat, corn"
                    onChange={e=>setArr("cropInvestment",i,"cropType",e.target.value)} />
                </div>
                <div className="input-group" style={{width:90,flexShrink:0}}>
                  <div className="input-wrap">
                    <input type="text" value={r.acres} placeholder="0"
                      onChange={e=>setArr("cropInvestment",i,"acres",e.target.value.replace(/[^0-9.]/g,""))} />
                  </div>
                </div>
                <div className="input-group" style={{width:120,flexShrink:0}}>
                  <div className="input-wrap">
                    <span className="prefix">$</span>
                    <input type="text" value={r.valuePerAcre} placeholder="0.00"
                      onChange={e=>setArr("cropInvestment",i,"valuePerAcre",e.target.value.replace(/[^0-9.]/g,""))} />
                  </div>
                </div>
                <CalcRow value={rv} style={{width:115}} />
                <button className="remove-btn" onClick={()=>removeRow("cropInvestment",i)}>x</button>
              </div>
            );
          })}
          <button className="add-btn" onClick={()=>addRow("cropInvestment",{cropType:"",acres:"",valuePerAcre:""})}>+ Add Crop</button>
          <div className="subtotal-row total"><span>Total Crop Investment</span><strong>{fmt(cropInv)}</strong></div>
        </div>
      );
      case "supplies": return (
        <div className="step-content">
          <SecHdr icon="🛢" title="Supplies on Hand" subtitle="Fuel, chemicals, seed, parts, or other supplies with value" />
          {data.supplies.map((r,i) => (
            <div key={i} className="row-entry" data-rowkey={`supplies-${i}`}>
              <span className="row-num">{i+1}</span>
              <TxtInp label="Description" value={r.description} onChange={v=>setArr("supplies",i,"description",v)} placeholder="e.g., diesel fuel, seed" />
              <Inp label="Value" prefix="$" value={r.value} onChange={v=>setArr("supplies",i,"value",v)} />
              <button className="remove-btn" onClick={()=>removeRow("supplies",i)}>x</button>
            </div>
          ))}
          <button className="add-btn" onClick={()=>addRow("supplies",{description:"",value:""})}>+ Add Supply</button>
          <div className="subtotal-row"><span>Total Supplies</span><strong>{fmt(suppliesTotal)}</strong></div>
        </div>
      );
      case "other_current": return (
        <div className="step-content">
          <SecHdr icon="📦" title="Other Current Assets" subtitle="Anything else collectible within 12 months" />
          {data.otherCurrent.map((r,i) => (
            <div key={i} className="row-entry" data-rowkey={`otherCurrent-${i}`}>
              <span className="row-num">{i+1}</span>
              <TxtInp label="Description" value={r.description} onChange={v=>setArr("otherCurrent",i,"description",v)} />
              <Inp label="Amount" prefix="$" value={r.amount} onChange={v=>setArr("otherCurrent",i,"amount",v)} />
              <button className="remove-btn" onClick={()=>removeRow("otherCurrent",i)}>x</button>
            </div>
          ))}
          <button className="add-btn" onClick={()=>addRow("otherCurrent",{description:"",amount:""})}>+ Add Item</button>
          <div className="subtotal-row total">
            <span>Total Current Assets</span><strong className="green">{fmt(totalCurrentAssets)}</strong>
          </div>
        </div>
      );
      case "breeding_stock": return (
        <div className="step-content">
          <SecHdr icon="🐂" title="Breeding Stock" subtitle="Cattle, horses, hogs, sheep kept for breeding" />
          <p className="phase-badge">Intermediate and Long-Term Assets</p>
          {data.breedingStock.map((r,i) => (
            <div key={i} className="row-entry" data-rowkey={`breedingStock-${i}`}>
              <span className="row-num">{i+1}</span>
              <TxtInp label="Number" value={r.number} onChange={v=>setArr("breedingStock",i,"number",v)} placeholder="# head" />
              <TxtInp label="Kind" value={r.kind} onChange={v=>setArr("breedingStock",i,"kind",v)} placeholder="e.g., Angus cows" />
              <Inp label="Value" prefix="$" value={r.value} onChange={v=>setArr("breedingStock",i,"value",v)} />
              <button className="remove-btn" onClick={()=>removeRow("breedingStock",i)}>x</button>
            </div>
          ))}
          <button className="add-btn" onClick={()=>addRow("breedingStock",{number:"",kind:"",value:""})}>+ Add Breeding Stock</button>
          <div className="subtotal-row"><span>Total Breeding Stock</span><strong>{fmt(breedingTotal)}</strong></div>
        </div>
      );
      case "real_estate": return (
        <div className="step-content">
          <SecHdr icon="🏔" title="Real Estate" subtitle="Farmland, pasture, home — list each tract. Acres x Value/Acre = Total." />
          <div className="fp-header-row">
            <span style={{width:20}}></span>
            <span className="fp-col-label" style={{width:75}}>Acres</span>
            <span className="fp-col-label" style={{width:130}}>Type of RE</span>
            <span className="fp-col-label" style={{flex:1}}>Description</span>
            <span className="fp-col-label" style={{width:115}}>Value/Acre</span>
            <span className="fp-col-label" style={{width:115}}>Total</span>
            <span style={{width:32}}></span>
          </div>
          {data.realEstate.map((r,i) => {
            const rv = numVal(r.acres) * numVal(r.valuePerAcre);
            return (
              <div key={i} className="fp-row" data-rowkey={`realEstate-${i}`}>
                <span className="row-num">{i+1}</span>
                <div className="input-group" style={{width:75,flexShrink:0}}>
                  <div className="input-wrap">
                    <input type="text" value={r.acres} placeholder="0"
                      onChange={e=>setArr("realEstate",i,"acres",e.target.value.replace(/[^0-9.]/g,""))} />
                  </div>
                </div>
                <div className="input-group" style={{width:130,flexShrink:0}}>
                  <select className="unit-select" value={r.reType} onChange={e=>setArr("realEstate",i,"reType",e.target.value)}>
                    {CONDITIONS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{flex:1}}>
                  <input className="text-input" type="text" value={r.description}
                    placeholder="e.g., NW Sec 12, Cascade Co."
                    onChange={e=>setArr("realEstate",i,"description",e.target.value)} />
                </div>
                <div className="input-group" style={{width:115,flexShrink:0}}>
                  <div className="input-wrap">
                    <span className="prefix">$</span>
                    <input type="text" value={r.valuePerAcre} placeholder="0"
                      onChange={e=>setArr("realEstate",i,"valuePerAcre",e.target.value.replace(/[^0-9.]/g,""))} />
                  </div>
                </div>
                <CalcRow value={rv} style={{width:115}} />
                <button className="remove-btn" onClick={()=>removeRow("realEstate",i)}>x</button>
              </div>
            );
          })}
          <button className="add-btn" onClick={()=>addRow("realEstate",{acres:"",reType:"",description:"",valuePerAcre:""})}>+ Add RE Tract</button>
          <div className="subtotal-row total"><span>Total Real Estate</span><strong>{fmt(reTotal)}</strong></div>
        </div>
      );
      case "re_contracts": return (
        <div className="step-content">
          <SecHdr icon="📄" title="Real Estate Sale Contracts Receivable" subtitle="Land contracts where the client is the seller" />
          {data.reContracts.map((r,i) => (
            <div key={i} className="row-entry" data-rowkey={`reContracts-${i}`}>
              <span className="row-num">{i+1}</span>
              <TxtInp label="Description / Buyer" value={r.description} onChange={v=>setArr("reContracts",i,"description",v)} />
              <Inp label="Balance Owed" prefix="$" value={r.amount} onChange={v=>setArr("reContracts",i,"amount",v)} />
              <button className="remove-btn" onClick={()=>removeRow("reContracts",i)}>x</button>
            </div>
          ))}
          <button className="add-btn" onClick={()=>addRow("reContracts",{description:"",amount:""})}>+ Add Contract</button>
          <div className="subtotal-row"><span>Total RE Contracts</span><strong>{fmt(reConTotal)}</strong></div>
        </div>
      );
      case "vehicles": return (
        <div className="step-content">
          <SecHdr icon="🚗" title="Titled Vehicles Schedule" subtitle="Trucks, pickups, cars, ATVs — anything licensed and titled" />
          <div className="mach-table">
            <div className="mach-header">
              <span style={{width:62}}>Year</span>
              <span style={{flex:1}}>Make and Model</span>
              <span style={{width:130}}>VIN</span>
              <span style={{width:95}}>Condition</span>
              <span style={{width:110}}>Value</span>
              <span style={{width:32}}></span>
            </div>
            {data.vehicles.map((r,i) => (
              <div key={i} className="mach-row" data-rowkey={`vehicles-${i}`}>
                <div className="mach-col" style={{width:62}}>
                  <input className="text-input" type="text" value={r.year} placeholder="2020" maxLength={4}
                    onChange={e=>setArr("vehicles",i,"year",e.target.value.replace(/[^0-9]/g,""))} />
                </div>
                <div className="mach-col" style={{flex:1}}>
                  <input className="text-input" type="text" value={r.make} placeholder="e.g., Ford F-350"
                    onChange={e=>setArr("vehicles",i,"make",e.target.value)} />
                </div>
                <div className="mach-col" style={{width:130}}>
                  <input className="text-input" type="text" value={r.vin} placeholder="VIN"
                    onChange={e=>setArr("vehicles",i,"vin",e.target.value)} />
                </div>
                <div className="mach-col" style={{width:95}}>
                  <select className="unit-select" value={r.condition}
                    onChange={e=>setArr("vehicles",i,"condition",e.target.value)}>
                    <option value="">—</option>
                    <option>Excellent</option><option>Good</option>
                    <option>Fair</option><option>Poor</option>
                  </select>
                </div>
                <div className="mach-col" style={{width:110}}>
                  <div className="input-wrap">
                    <span className="prefix">$</span>
                    <input type="text" value={r.value} placeholder="0"
                      onChange={e=>setArr("vehicles",i,"value",e.target.value.replace(/[^0-9.]/g,""))} />
                  </div>
                </div>
                <button className="remove-btn" onClick={()=>removeRow("vehicles",i)}>x</button>
              </div>
            ))}
          </div>
          <button className="add-btn" onClick={()=>addRow("vehicles",{year:"",make:"",vin:"",condition:"",value:""})}>+ Add Vehicle</button>
          <div className="subtotal-row total"><span>Total Titled Vehicles</span><strong>{fmt(vehiclesVal)}</strong></div>
        </div>
      );
      case "machinery": return (
        <div className="step-content">
          <SecHdr icon="⚙" title="Machinery and Equipment Schedule" subtitle="List each piece — total carries to balance sheet automatically" />
          <div className="mach-table">
            <div className="mach-header">
              <span style={{width:62}}>Year</span>
              <span style={{flex:1}}>Make and Model</span>
              <span style={{width:90}}>Size</span>
              <span style={{width:110}}>Serial #</span>
              <span style={{width:95}}>Condition</span>
              <span style={{width:110}}>Value</span>
              <span style={{width:32}}></span>
            </div>
            {data.machinery.map((r,i) => (
              <div key={i} className="mach-row" data-rowkey={`machinery-${i}`}>
                <div className="mach-col" style={{width:62}}>
                  <input className="text-input" type="text" value={r.year} placeholder="2018" maxLength={4}
                    onChange={e=>setArr("machinery",i,"year",e.target.value.replace(/[^0-9]/g,""))} />
                </div>
                <div className="mach-col" style={{flex:1}}>
                  <input className="text-input" type="text" value={r.make} placeholder="e.g., John Deere 8320"
                    onChange={e=>setArr("machinery",i,"make",e.target.value)} />
                </div>
                <div className="mach-col" style={{width:90}}>
                  <input className="text-input" type="text" value={r.size} placeholder="e.g., 320hp"
                    onChange={e=>setArr("machinery",i,"size",e.target.value)} />
                </div>
                <div className="mach-col" style={{width:110}}>
                  <input className="text-input" type="text" value={r.serial} placeholder="Serial #"
                    onChange={e=>setArr("machinery",i,"serial",e.target.value)} />
                </div>
                <div className="mach-col" style={{width:95}}>
                  <select className="unit-select" value={r.condition}
                    onChange={e=>setArr("machinery",i,"condition",e.target.value)}>
                    <option value="">—</option>
                    <option>Excellent</option><option>Good</option>
                    <option>Fair</option><option>Poor</option>
                  </select>
                </div>
                <div className="mach-col" style={{width:110}}>
                  <div className="input-wrap">
                    <span className="prefix">$</span>
                    <input type="text" value={r.value} placeholder="0"
                      onChange={e=>setArr("machinery",i,"value",e.target.value.replace(/[^0-9.]/g,""))} />
                  </div>
                </div>
                <button className="remove-btn" onClick={()=>removeRow("machinery",i)}>x</button>
              </div>
            ))}
          </div>
          <button className="add-btn" onClick={()=>addRow("machinery",{year:"",make:"",size:"",serial:"",condition:"",value:""})}>+ Add Equipment</button>
          <div className="subtotal-row total"><span>Total Machinery and Equipment</span><strong>{fmt(machVal)}</strong></div>
        </div>
      );
      case "other_assets": return (
        <div className="step-content">
          <SecHdr icon="💼" title="Other Assets" subtitle="Investments, retirement accounts, life insurance cash value, notes receivable" />
          {data.otherAssets.map((r,i) => (
            <div key={i} className="row-entry" data-rowkey={`otherAssets-${i}`}>
              <span className="row-num">{i+1}</span>
              <TxtInp label="Description" value={r.description} onChange={v=>setArr("otherAssets",i,"description",v)} placeholder="e.g., IRA, stock, bonds" />
              <Inp label="Value" prefix="$" value={r.amount} onChange={v=>setArr("otherAssets",i,"amount",v)} />
              <button className="remove-btn" onClick={()=>removeRow("otherAssets",i)}>x</button>
            </div>
          ))}
          <button className="add-btn" onClick={()=>addRow("otherAssets",{description:"",amount:""})}>+ Add Asset</button>
          <div className="subtotal-row total">
            <span>Total Assets</span><strong className="green">{fmt(totalAssets)}</strong>
          </div>
        </div>
      );
      case "liab_intro": return (
        <div className="step-content">
          <SecHdr icon="📉" title="Now — Liabilities" subtitle="Assets are done. Now capture what the client owes." color="#4a0810" />
          <div style={{background:"#f8f6f2",borderRadius:8,padding:16,display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"flex",justifyContent:"space-between"}}><span>Total Assets</span><strong>{fmt(totalAssets)}</strong></div>
            <div style={{display:"flex",justifyContent:"space-between"}}><span>Current Assets</span><strong>{fmt(totalCurrentAssets)}</strong></div>
            <div style={{display:"flex",justifyContent:"space-between"}}><span>Long-Term Assets</span><strong>{fmt(totalLTAssets)}</strong></div>
          </div>
        </div>
      );
      case "operating_notes": return (
        <div className="step-content">
          <SecHdr icon="🏦" title="Operating and Unsecured Notes" subtitle="Operating lines of credit, seasonal loans, and unsecured debts" color="#4a0810" />
          {data.operatingNotes.map((r,i) => (
            <div key={i} className="row-entry" data-rowkey={`operatingNotes-${i}`}>
              <span className="row-num">{i+1}</span>
              <TxtInp label="Creditor" value={r.creditor} onChange={v=>setArr("operatingNotes",i,"creditor",v)} placeholder="Lender name" />
              <TxtInp label="Due Date" value={r.dueDate} onChange={v=>setArr("operatingNotes",i,"dueDate",v)} placeholder="mm/dd/yy" />
              <Inp label="Payment" prefix="$" value={r.pmt} onChange={v=>setArr("operatingNotes",i,"pmt",v)} />
              <Inp label="Balance" prefix="$" value={r.balance} onChange={v=>setArr("operatingNotes",i,"balance",v)} />
              <TxtInp label="Security" value={r.security} onChange={v=>setArr("operatingNotes",i,"security",v)} placeholder="Collateral type" />
              <button className="remove-btn" onClick={()=>removeRow("operatingNotes",i)}>x</button>
            </div>
          ))}
          <button className="add-btn" onClick={()=>addRow("operatingNotes",{creditor:"",dueDate:"",pmt:"",balance:"",security:""})}>+ Add Note</button>
          <div className="subtotal-row"><span>Total Operating Notes</span><strong className="red">{fmt(opNotesTotal)}</strong></div>
        </div>
      );
      case "accounts_due": return (
        <div className="step-content">
          <SecHdr icon="🧾" title="Accounts Due" subtitle="Trade accounts, supplier balances, amounts owed to vendors" color="#4a0810" />
          {data.accountsDue.map((r,i) => (
            <div key={i} className="row-entry" data-rowkey={`accountsDue-${i}`}>
              <span className="row-num">{i+1}</span>
              <TxtInp label="Creditor / Vendor" value={r.creditor} onChange={v=>setArr("accountsDue",i,"creditor",v)} placeholder="Who is owed" />
              <Inp label="Amount" prefix="$" value={r.amount} onChange={v=>setArr("accountsDue",i,"amount",v)} />
              <button className="remove-btn" onClick={()=>removeRow("accountsDue",i)}>x</button>
            </div>
          ))}
          <button className="add-btn" onClick={()=>addRow("accountsDue",{creditor:"",amount:""})}>+ Add Account</button>
          <div className="subtotal-row"><span>Total Accounts Due</span><strong className="red">{fmt(acctsDueTotal)}</strong></div>
        </div>
      );
      case "intermediate_debt": return (
        <div className="step-content">
          <SecHdr icon="📅" title="Intermediate Term and Installment Debt" subtitle="Equipment loans, livestock loans, term notes" color="#4a0810" />
          {data.intermediatDebt.map((r,i) => (
            <div key={i} className="row-entry" data-rowkey={`intermediatDebt-${i}`}>
              <span className="row-num">{i+1}</span>
              <TxtInp label="Creditor" value={r.creditor} onChange={v=>setArr("intermediatDebt",i,"creditor",v)} placeholder="Lender" />
              <TxtInp label="Security" value={r.security} onChange={v=>setArr("intermediatDebt",i,"security",v)} placeholder="Collateral" />
              <TxtInp label="Due Date" value={r.dueDate} onChange={v=>setArr("intermediatDebt",i,"dueDate",v)} placeholder="mm/dd/yy" />
              <Inp label="Annual Pmt" prefix="$" value={r.annualPmt} onChange={v=>setArr("intermediatDebt",i,"annualPmt",v)} />
              <Inp label="Principal" prefix="$" value={r.principal} onChange={v=>setArr("intermediatDebt",i,"principal",v)} />
              <Inp label="Rate" prefix="%" value={r.rate} onChange={v=>setArr("intermediatDebt",i,"rate",v)} />
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:70}}>
                <span style={{fontSize:".68rem",textTransform:"uppercase",letterSpacing:".07em",color:"#555",fontWeight:600}}>Corp Pays</span>
                <input type="checkbox" checked={!!r.corpPaid}
                  onChange={e=>setArr("intermediatDebt",i,"corpPaid",e.target.checked)}
                  style={{width:16,height:16,accentColor:"#6B0E1E",cursor:"pointer"}} />
              </div>
              <button className="remove-btn" onClick={()=>removeRow("intermediatDebt",i)}>x</button>
            </div>
          ))}
          <button className="add-btn" onClick={()=>addRow("intermediatDebt",{creditor:"",security:"",dueDate:"",annualPmt:"",principal:"",rate:"",corpPaid:false})}>+ Add Loan</button>
          <div className="subtotal-row"><span>Total Intermediate Debt</span><strong className="red">{fmt(intermedTotal)}</strong></div>
        </div>
      );
      case "re_current": return (
        <div className="step-content">
          <SecHdr icon="🏠" title="Current Portion — Real Estate Mortgages" subtitle="Mortgage payments due within the next 12 months" color="#4a0810" />
          {data.reCurrent.map((r,i) => (
            <div key={i} className="row-entry" data-rowkey={`reCurrent-${i}`}>
              <span className="row-num">{i+1}</span>
              <TxtInp label="Creditor" value={r.creditor} onChange={v=>setArr("reCurrent",i,"creditor",v)} placeholder="Mortgage holder" />
              <Inp label="Annual Payment" prefix="$" value={r.annualPmt} onChange={v=>setArr("reCurrent",i,"annualPmt",v)} />
              <Inp label="Rate" prefix="%" value={r.rate} onChange={v=>setArr("reCurrent",i,"rate",v)} />
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:70}}>
                <span style={{fontSize:".68rem",textTransform:"uppercase",letterSpacing:".07em",color:"#555",fontWeight:600}}>Corp Pays</span>
                <input type="checkbox" checked={!!r.corpPaid}
                  onChange={e=>setArr("reCurrent",i,"corpPaid",e.target.checked)}
                  style={{width:16,height:16,accentColor:"#6B0E1E",cursor:"pointer"}} />
              </div>
              <button className="remove-btn" onClick={()=>removeRow("reCurrent",i)}>x</button>
            </div>
          ))}
          <button className="add-btn" onClick={()=>addRow("reCurrent",{creditor:"",annualPmt:"",rate:"",corpPaid:false})}>+ Add Mortgage</button>
          <div className="subtotal-row"><span>Total Current RE Portion</span><strong className="red">{fmt(reCurrentTotal)}</strong></div>
        </div>
      );
      case "taxes_due": return (
        <div className="step-content">
          <SecHdr icon="📑" title="State and Federal Income Taxes Due" subtitle="Any unpaid income tax liability" color="#4a0810" />
          <Inp label="Income taxes due" prefix="$" value={data.taxesDue} onChange={v=>set("taxesDue",v)} />
          <div className="subtotal-row total">
            <span>Total Current Liabilities</span><strong className="red">{fmt(totalCurrentLiab)}</strong>
          </div>
        </div>
      );
      case "other_current_liab": return (
        <div className="step-content">
          <SecHdr icon="📋" title="Other Current Liabilities" subtitle="Any other obligations due within 12 months" color="#4a0810" />
          {data.otherCurrentLiab.map((r,i) => (
            <div key={i} className="row-entry" data-rowkey={`otherCurrentLiab-${i}`}>
              <span className="row-num">{i+1}</span>
              <TxtInp label="Description" value={r.description} onChange={v=>setArr("otherCurrentLiab",i,"description",v)} />
              <Inp label="Amount" prefix="$" value={r.amount} onChange={v=>setArr("otherCurrentLiab",i,"amount",v)} />
              <button className="remove-btn" onClick={()=>removeRow("otherCurrentLiab",i)}>x</button>
            </div>
          ))}
          <button className="add-btn" onClick={()=>addRow("otherCurrentLiab",{description:"",amount:""})}>+ Add Liability</button>
        </div>
      );
      case "re_mortgages": return (
        <div className="step-content">
          <SecHdr icon="📜" title="Real Estate Mortgages and Contracts" subtitle="Long-term mortgage balances — principal due beyond 12 months" color="#4a0810" />
          {data.reMortgages.map((r,i) => (
            <div key={i} className="row-entry" data-rowkey={`reMortgages-${i}`}>
              <span className="row-num">{i+1}</span>
              <TxtInp label="Lien Holder" value={r.lienHolder} onChange={v=>setArr("reMortgages",i,"lienHolder",v)} placeholder="Bank / lender" />
              <TxtInp label="Terms" value={r.terms} onChange={v=>setArr("reMortgages",i,"terms",v)} placeholder="e.g., 20yr" />
              <Inp label="Rate" prefix="%" value={r.rate} onChange={v=>setArr("reMortgages",i,"rate",v)} />
              <Inp label="Principal (beyond 12 mo)" prefix="$" value={r.principal} onChange={v=>setArr("reMortgages",i,"principal",v)} />
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:70}}>
                <span style={{fontSize:".68rem",textTransform:"uppercase",letterSpacing:".07em",color:"#555",fontWeight:600}}>Corp Pays</span>
                <input type="checkbox" checked={!!r.corpPaid}
                  onChange={e=>setArr("reMortgages",i,"corpPaid",e.target.checked)}
                  style={{width:16,height:16,accentColor:"#6B0E1E",cursor:"pointer"}} />
              </div>
              <button className="remove-btn" onClick={()=>removeRow("reMortgages",i)}>x</button>
            </div>
          ))}
          <button className="add-btn" onClick={()=>addRow("reMortgages",{lienHolder:"",terms:"",principal:"",rate:"",corpPaid:false})}>+ Add Mortgage</button>
          <div className="subtotal-row"><span>Total RE Mortgages (LT)</span><strong className="red">{fmt(reMortTotal)}</strong></div>
        </div>
      );
      case "other_liabilities": return (
        <div className="step-content">
          <SecHdr icon="🔖" title="Other Liabilities" subtitle="Student loans, personal loans, judgments, etc." color="#4a0810" />
          {data.otherLiabilities.map((r,i) => (
            <div key={i} className="row-entry" data-rowkey={`otherLiabilities-${i}`}>
              <span className="row-num">{i+1}</span>
              <TxtInp label="Description" value={r.description} onChange={v=>setArr("otherLiabilities",i,"description",v)} />
              <Inp label="Balance" prefix="$" value={r.balance} onChange={v=>setArr("otherLiabilities",i,"balance",v)} />
              <button className="remove-btn" onClick={()=>removeRow("otherLiabilities",i)}>x</button>
            </div>
          ))}
          <button className="add-btn" onClick={()=>addRow("otherLiabilities",{description:"",balance:""})}>+ Add Liability</button>
          <div className="subtotal-row total">
            <span>Total Liabilities</span><strong className="red">{fmt(totalLiabilities)}</strong>
          </div>
        </div>
      );
      case "summary": return (
        <div className="step-content">
          <SecHdr icon="📊" title="Balance Sheet Complete" subtitle={data.clientName + " — as of " + data.asOfDate} />
          <div className="summary-grid">
            <div>
              <h3 className="col-head assets-head">ASSETS</h3>
              <div className="summary-section">
                <div className="ss-label">Current Assets</div>
                <div className="ss-row"><span>Cash on Hand and in Bank</span><span>{fmt(cashTotal)}</span></div>
                {recTotal > 0 && <div className="ss-row"><span>Receivables</span><span>{fmt(recTotal)}</span></div>}
                {fedPay > 0 && (Array.isArray(data.federalPayments) && data.federalPayments.filter(r=>n(r.amount)>0).length > 1
  ? data.federalPayments.filter(r=>n(r.amount)>0).map((r,i) => (
      <div key={i} className="ss-row"><span>{r.program||"Federal Payment"}</span><span>{fmt(r.amount)}</span></div>
    ))
  : <div className="ss-row"><span>Federal Payments</span><span>{fmt(fedPay)}</span></div>
)}
                {lsMktTotal > 0 && <div className="ss-row"><span>Market Livestock</span><span>{fmt(lsMktTotal)}</span></div>}
                {farmProdTotal > 0 && <div className="ss-row"><span>Farm Products</span><span>{fmt(farmProdTotal)}</span></div>}
                {cropInv > 0 && <div className="ss-row"><span>Crop Investment</span><span>{fmt(cropInv)}</span></div>}
                {suppliesTotal > 0 && <div className="ss-row"><span>Supplies</span><span>{fmt(suppliesTotal)}</span></div>}
                <div className="ss-subtotal"><span>Total Current Assets</span><span>{fmt(totalCurrentAssets)}</span></div>
              </div>
              <div className="summary-section">
                <div className="ss-label">Long-Term Assets</div>
                {breedingTotal > 0 && <div className="ss-row"><span>Breeding Stock</span><span>{fmt(breedingTotal)}</span></div>}
                {reTotal > 0 && <div className="ss-row"><span>Real Estate</span><span>{fmt(reTotal)}</span></div>}
                {vehiclesVal > 0 && <div className="ss-row"><span>Titled Vehicles</span><span>{fmt(vehiclesVal)}</span></div>}
                {machVal > 0 && <div className="ss-row"><span>Machinery and Equipment</span><span>{fmt(machVal)}</span></div>}
                {Object.entries(linkedEntityNWMap).map(([name, nw]) => (
                  <div key={name} className="ss-row" style={{color:"#2d5a8e",fontStyle:"italic"}}>
                    <span>Investment in {name}</span>
                    <span>{fmt(nw)}</span>
                  </div>
                ))}
                <div className="ss-subtotal"><span>Total Long-Term Assets</span><span>{fmt(totalLTAssets + linkedEntityVal)}</span></div>
              </div>
              <div className="ss-total green-total"><span>TOTAL ASSETS</span><span>{fmt(totalAssets)}</span></div>
            </div>
            <div>
              <h3 className="col-head liab-head">LIABILITIES</h3>
              <div className="summary-section">
                <div className="ss-label">Current Liabilities</div>
                {opNotesTotal > 0 && <div className="ss-row"><span>Operating Notes</span><span>{fmt(opNotesTotal)}</span></div>}
                {acctsDueTotal > 0 && <div className="ss-row"><span>Accounts Due</span><span>{fmt(acctsDueTotal)}</span></div>}
                {intermedCurrentPortion > 0 && <div className="ss-row"><span>Intermediate Debt (current portion)</span><span>{fmt(intermedCurrentPortion)}</span></div>}
                {reCurrentTotal > 0 && <div className="ss-row"><span>RE Mortgage Current</span><span>{fmt(reCurrentTotal)}</span></div>}
                {taxesDueVal > 0 && <div className="ss-row"><span>Income Taxes Due</span><span>{fmt(taxesDueVal)}</span></div>}
                <div className="ss-subtotal"><span>Total Current Liabilities</span><span>{fmt(totalCurrentLiab)}</span></div>
              </div>
              <div className="summary-section">
                <div className="ss-label">Long-Term Liabilities</div>
                {intermedLTPortion > 0 && <div className="ss-row"><span>Intermediate Debt (LT portion)</span><span>{fmt(intermedLTPortion)}</span></div>}
                {reMortTotal > 0 && <div className="ss-row"><span>RE Mortgages (LT)</span><span>{fmt(reMortTotal)}</span></div>}
                {otherLiabTotal > 0 && <div className="ss-row"><span>Other Liabilities</span><span>{fmt(otherLiabTotal)}</span></div>}
                <div className="ss-subtotal"><span>Total Long-Term</span><span>{fmt(reMortTotal+otherLiabTotal)}</span></div>
              </div>
              <div className="ss-total red-total"><span>TOTAL LIABILITIES</span><span>{fmt(totalLiabilities)}</span></div>
              <div className="net-section">
                <div className="net-row"><span>Working Capital</span><span className={workingCapital >= 0 ? "green" : "red"}>{fmt(workingCapital)}</span></div>
                <div className="net-row nw"><span>NET WORTH</span><span className={netWorth >= 0 ? "green" : "red"}>{fmt(netWorth)}</span></div>
                <div className="net-row"><span>Debt-to-Asset Ratio</span><span>{totalAssets > 0 ? ((totalLiabilities/totalAssets)*100).toFixed(1)+"%" : "—"}</span></div>
              </div>
            </div>
          </div>
          {/* ── Entity Link Section ── */}
          <div style={{background:"#f0f6ff",border:"1px solid #c0d8f0",borderRadius:10,padding:16,marginTop:8}}>
            <div style={{fontWeight:700,fontSize:".88rem",color:"#2d5a8e",marginBottom:10}}>
              Linked Business Entities
              <span style={{fontWeight:400,fontSize:".78rem",color:"#888",marginLeft:8}}>
                Their net worth appears as an investment asset on this statement
              </span>
            </div>

            {/* Currently linked entities */}
            {(data.linkedEntities||[]).length > 0 && (
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
                {(data.linkedEntities||[]).map((name, i) => (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:"white",border:"1px solid #c0d8f0",borderRadius:8,padding:"8px 12px"}}>
                    <span style={{fontSize:"1rem"}}>🏢</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:".88rem",color:"#1a1a1a"}}>{name}</div>
                      {linkedEntityNWMap[name] !== undefined && (
                        <div style={{fontSize:".78rem",color:"#2d5a8e"}}>
                          Net Worth: {fmt(linkedEntityNWMap[name])}
                          {" — added as Investment in " + name}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={()=>set("linkedEntities",(data.linkedEntities||[]).filter((_,j)=>j!==i))}
                      style={{background:"none",border:"1px solid #f0c0c0",borderRadius:5,padding:"3px 8px",fontSize:".75rem",cursor:"pointer",color:"#c44",fontFamily:"inherit"}}>
                      Remove
                    </button>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"flex-end",fontSize:".82rem",fontWeight:700,color:"#2d5a8e",padding:"4px 6px"}}>
                  Total Investment Value: {fmt(linkedEntityVal)}
                </div>
              </div>
            )}

            {/* Add entity dropdown */}
            {availableEntities.length > 0 ? (
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <select
                  defaultValue=""
                  onChange={e=>{
                    const name = e.target.value;
                    if (!name) return;
                    if (!(data.linkedEntities||[]).includes(name)) {
                      set("linkedEntities",[...(data.linkedEntities||[]),name]);
                    }
                    e.target.value = "";
                  }}
                  style={{border:"1.5px solid #c0d8f0",borderRadius:7,padding:"7px 12px",fontSize:".88rem",fontFamily:"inherit",background:"white",color:"#1a1a1a",cursor:"pointer"}}>
                  <option value="">+ Add a linked entity...</option>
                  {availableEntities.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <span style={{fontSize:".75rem",color:"#aaa"}}>
                  Select from saved clients
                </span>
              </div>
            ) : (data.linkedEntities||[]).length === 0 ? (
              <div style={{fontSize:".78rem",color:"#888"}}>
                Save other balance sheets first, then link them here to include their net worth on this statement.
              </div>
            ) : (
              <div style={{fontSize:".78rem",color:"#aaa",fontStyle:"italic"}}>
                All available entities are already linked.
              </div>
            )}
          </div>

          <div className="print-note">Review all figures with your client, then click Print Balance Sheet.</div>
          <div className="save-bar">
            <div className="save-date-wrap">
              <label>Save as of date:</label>
              <input type="date" className="text-input" style={{maxWidth:160}} value={data.asOfDate}
                onChange={e=>set("asOfDate",e.target.value)} />
            </div>
            <button className="btn btn-save" onClick={saveSheet}
              disabled={!data.clientName || saveStatus === "saving"}>
              {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : saveStatus && saveStatus !== "error" ? "Error: " + saveStatus.slice(0,60) : "Save Balance Sheet"}
            </button>
            <button className="btn btn-secondary" onClick={()=>setScreen("home")}>All Clients</button>
            {data.clientName && (
              <button onClick={generateBSShare}
                style={{padding:"10px 18px",background:"#2d5a8e",color:"white",border:"none",borderRadius:8,fontWeight:700,fontSize:".88rem",cursor:"pointer",fontFamily:"inherit"}}>
                🔗 Share with Customer
              </button>
            )}
          </div>
        </div>
      );
      default: return null;
    }
  }

  // ── Home Screen ────────────────────────────────────────────────────────────
  // ── Login screen ─────────────────────────────────────────────────────────────
  if (!session) {
    const handleLogin = async () => {
      setLoginError(""); setLoginLoading(true);
      try { const s = await supaLogin(loginEmail, loginPassword); setSession(s); }
      catch(err) { setLoginError(err.message || "Login failed. Check your email and password."); }
      finally { setLoginLoading(false); }
    };
    return (
      <div style={{minHeight:"100vh",background:"#6B0E1E",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{background:"white",borderRadius:14,padding:40,width:"min(400px,100%)",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontSize:36,marginBottom:8}}>🏦</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:22,color:"#6B0E1E"}}>First Bank of Montana</div>
            <div style={{fontSize:13,color:"#888",marginTop:4}}>Agricultural Balance Sheet System</div>
          </div>
          {loginError && <div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:6,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#991b1b"}}>{loginError}</div>}
          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>EMAIL</label>
            <input type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)}
              placeholder="your@email.com" onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              style={{width:"100%",border:"1px solid #d1d5db",borderRadius:6,padding:"9px 12px",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div style={{marginBottom:22}}>
            <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>PASSWORD</label>
            <input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)}
              placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              style={{width:"100%",border:"1px solid #d1d5db",borderRadius:6,padding:"9px 12px",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <button onClick={handleLogin} disabled={loginLoading}
            style={{width:"100%",background:"#6B0E1E",color:"white",border:"none",borderRadius:6,padding:11,fontWeight:700,fontSize:15,cursor:loginLoading?"wait":"pointer",opacity:loginLoading?.7:1,fontFamily:"inherit"}}>
            {loginLoading ? "Signing in…" : "Sign In"}
          </button>
          <div style={{textAlign:"center",fontSize:11,color:"#9ca3af",marginTop:16}}>Contact your administrator for access</div>
        </div>
      </div>
    );
  }

  if (screen === "home") {
    return (
      <div className="app">
        <div className="home-top">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div className="home-top-title">First Bank of Montana</div>
              <div className="home-top-sub">Agricultural Balance Sheet System</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              {session?.user?.email && <span style={{fontSize:".82rem",color:"rgba(255,255,255,.7)"}}>{profile?.full_name||session.user.email}{profile?.role==="admin"&&<span style={{marginLeft:5,background:"rgba(255,255,255,.2)",padding:"1px 7px",borderRadius:999,fontSize:10,fontWeight:700}}>ADMIN</span>}</span>}
              <button onClick={async()=>{await supaLogout();setSession(null);setProfile(null);}} style={{background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.3)",color:"rgba(255,255,255,.85)",borderRadius:5,padding:"5px 12px",cursor:"pointer",fontSize:".8rem",fontFamily:"inherit"}}>Sign Out</button>
            </div>
          </div>
        </div>
        <div className="home-body">
          <div style={{display:"flex",gap:12,marginBottom:36,flexWrap:"wrap"}}>
            <button className="home-new-btn" style={{margin:0}} onClick={startNew}>
              + New Balance Sheet
            </button>
            <button className="home-new-btn" style={{margin:0,background:"#2d5a8e"}}
              onClick={()=>{setImportData(null);setImportError("");setShowImport(true);}}>
              Import from CSV / Excel
            </button>
          </div>

          {/* ── Import Modal ── */}
          {showImport && (
            <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
              <div style={{background:"white",borderRadius:14,padding:32,maxWidth:600,width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 10px 50px rgba(0,0,0,.25)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                  <div style={{fontSize:"1.15rem",fontWeight:700,color:"#1a1a1a"}}>Import Balance Sheet Data</div>
                  <button onClick={()=>setShowImport(false)}
                    style={{background:"none",border:"none",fontSize:"1.4rem",cursor:"pointer",color:"#888",lineHeight:1}}>x</button>
                </div>

                <div style={{background:"#f0f6ff",border:"1px solid #c0d8f0",borderRadius:8,padding:14,marginBottom:20,fontSize:".85rem",color:"#2d5a8e"}}>
                  <strong>Supported formats:</strong>
                  <ul style={{margin:"6px 0 0 16px",lineHeight:1.8}}>
                    <li><strong>FBMT Excel format</strong> — the existing First Bank of Montana balance sheet Excel file (.xlsx). Just drag it in as-is.</li>
                    <li><strong>Import template</strong> — download the template below, fill it in, drag it back.</li>
                  </ul>
                </div>

                <button onClick={downloadTemplate}
                  style={{display:"flex",alignItems:"center",gap:8,background:"#2d5a8e",color:"white",border:"none",borderRadius:8,padding:"10px 20px",fontSize:".9rem",fontWeight:600,cursor:"pointer",marginBottom:20,fontFamily:"inherit"}}>
                  Download Import Template (.xlsx)
                </button>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={e=>{e.preventDefault();setImportDragging(true);}}
                  onDragLeave={()=>setImportDragging(false)}
                  onDrop={e=>{e.preventDefault();setImportDragging(false);const f=e.dataTransfer.files[0];if(f)handleImportFile(f);}}
                  style={{
                    border:"2.5px dashed " + (importDragging ? "#2d5a8e" : "#ccc"),
                    borderRadius:10,padding:"28px 20px",textAlign:"center",
                    background:importDragging ? "#f0f6ff" : "#fafafa",
                    transition:"all .15s",marginBottom:16
                  }}>
                  <div style={{fontSize:"2rem",marginBottom:8}}>📂</div>
                  <div style={{fontWeight:600,color:"#333",marginBottom:12}}>
                    {importDragging ? "Drop to import" : "Drag and drop your file here"}
                  </div>
                  <label style={{
                    display:"inline-block",background:"#2d5a8e",color:"white",
                    borderRadius:7,padding:"9px 20px",fontSize:".88rem",fontWeight:600,
                    cursor:"pointer",fontFamily:"inherit"
                  }}>
                    Browse for File
                    <input type="file" accept=".csv,.xlsx,.xls"
                      style={{display:"none"}}
                      onChange={e=>{if(e.target.files[0])handleImportFile(e.target.files[0]);}} />
                  </label>
                  <div style={{fontSize:".78rem",color:"#aaa",marginTop:10}}>CSV, XLSX, or XLS</div>
                </div>

                {importError && (
                  <div style={{background:"#fce8e8",border:"1px solid #f0c0c0",borderRadius:8,padding:12,fontSize:".85rem",color:"#7a1a1a",marginBottom:16}}>
                    {importError}
                  </div>
                )}

                {importData && (
                  <div>
                    <div style={{background:"#e8f5ea",border:"1px solid #b8dfc0",borderRadius:8,padding:14,marginBottom:16}}>
                      <div style={{fontWeight:700,color:"#1a5c25",marginBottom:8}}>File parsed successfully</div>
                      <div style={{fontSize:".85rem",color:"#2a4a2a",display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                        <span>Client: <strong>{importData.clientName || "(none)"}</strong></span>
                        <span>Cash (Glacier): <strong>{importData.cashGlacier ? "$"+Number(importData.cashGlacier).toLocaleString() : "$0"}</strong></span>
                        <span>Farm Products: <strong>{importData.farmProducts.filter(r=>r.kind).length} items</strong></span>
                        <span>Real Estate: <strong>{importData.realEstate.filter(r=>r.acres).length} tracts</strong></span>
                        <span>Machinery: <strong>{importData.machinery.filter(r=>r.make).length} items</strong></span>
                        <span>Vehicles: <strong>{importData.vehicles.filter(r=>r.make).length} items</strong></span>
                        <span>Term Debt: <strong>{importData.intermediatDebt.filter(r=>r.creditor).length} loans</strong></span>
                        <span>RE Mortgages: <strong>{importData.reMortgages.filter(r=>r.lienHolder).length} mortgages</strong></span>
                      </div>
                    </div>

                    <div style={{marginBottom:20}}>
                      <label style={{fontSize:".8rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#555",display:"block",marginBottom:6}}>
                        As of Date
                      </label>
                      <input type="date" value={importDate}
                        onChange={e=>setImportDate(e.target.value)}
                        style={{border:"1.5px solid #ddd",borderRadius:7,padding:"9px 12px",fontSize:"1rem",fontFamily:"inherit",outline:"none",width:200}} />
                      <div style={{fontSize:".75rem",color:"#888",marginTop:4}}>
                        Set the balance sheet date for this import
                      </div>
                    </div>

                    <div style={{display:"flex",gap:12}}>
                      <button className="btn btn-secondary" onClick={()=>setShowImport(false)}>Cancel</button>
                      <button className="btn btn-primary" onClick={applyImport}
                        style={{background:"#2d5a8e"}}>
                        Import and Open Balance Sheet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Pending Reviews ── */}
          {pendingReviews.length > 0 && (
            <div style={{marginBottom:28}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <span style={{fontSize:"1.1rem"}}>📬</span>
                <div style={{fontWeight:700,fontSize:".95rem",color:"#1a1a1a"}}>Pending Customer Submissions</div>
                <div style={{background:"#6B0E1E",color:"white",borderRadius:999,padding:"1px 8px",fontSize:".75rem",fontWeight:700}}>{pendingReviews.length}</div>
                <button onClick={loadPendingReviews} style={{marginLeft:"auto",background:"none",border:"1px solid #ddd",borderRadius:5,padding:"3px 10px",fontSize:".75rem",cursor:"pointer",color:"#888",fontFamily:"inherit"}}>Refresh</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {pendingReviews.map(review=>(
                  <div key={review.share_id} style={{background:"white",border:"2px solid #22c55e",borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",boxShadow:"0 1px 6px rgba(34,197,94,.15)"}}>
                    <span style={{fontSize:"1.4rem"}}>{review.type==='balance_sheet'?'📋':'🌾'}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:".95rem",color:"#1a1a1a"}}>{review.client_name}</div>
                      <div style={{fontSize:".78rem",color:"#555",marginTop:2}}>
                        {review.type==='balance_sheet'?'Balance Sheet':'Budget'} · Submitted {review.submitted_at?new Date(review.submitted_at).toLocaleDateString():'—'}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <input type="date"
                        value={reviewSaveDate[review.share_id]||review.as_of_date||new Date().toISOString().slice(0,10)}
                        onChange={e=>setReviewSaveDate(d=>({...d,[review.share_id]:e.target.value}))}
                        style={{border:"1px solid #d1d5db",borderRadius:6,padding:"5px 8px",fontSize:".82rem",fontFamily:"inherit",outline:"none"}}/>
                      <button
                        onClick={()=>{
                          const sd = reviewSaveDate[review.share_id]||review.as_of_date||new Date().toISOString().slice(0,10);
                          if(review.type==='balance_sheet') loadBSReview(review,sd);
                          else loadBudgetReview(review,sd);
                        }}
                        style={{background:"#6B0E1E",color:"white",border:"none",borderRadius:7,padding:"7px 14px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:".82rem"}}>
                        Load & Review
                      </button>
                      <button onClick={()=>markReviewed(review.share_id,review.type)}
                        style={{background:"none",border:"1px solid #ddd",borderRadius:7,padding:"6px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:".78rem",color:"#888"}}>
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="home-section-label" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span>
              {savedSheets.length > 0
                ? "Clients (" + Object.keys(savedSheets.reduce((g,s)=>{g[s.clientName]=true;return g;},{})).length + ")"
                : "Clients"}
            </span>
            <button onClick={()=>{setShowCreateFolder([]);setNewFolderName("");}}
              style={{background:"none",border:"1.5px dashed #6B0E1E",borderRadius:6,padding:"3px 12px",color:"#6B0E1E",fontSize:".78rem",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              + New Folder
            </button>
          </div>

          {/* ── Create Folder Modal ── */}
          {showCreateFolder !== null && (
            <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{background:"white",borderRadius:12,padding:28,maxWidth:400,width:"90%",boxShadow:"0 8px 40px rgba(0,0,0,.2)"}}>
                <div style={{fontWeight:700,fontSize:"1rem",marginBottom:8}}>
                  {showCreateFolder.length === 0 ? "Create Top-Level Folder" : "Create Subfolder inside " + showCreateFolder[showCreateFolder.length-1]}
                </div>
                <div style={{fontSize:".82rem",color:"#888",marginBottom:14}}>
                  Folders organize your clients. Examples: "Chris Mattson", "Smith Farms", "XYZ Corp"
                </div>
                <input className="text-input" type="text" value={newFolderName}
                  placeholder="Folder name..." autoFocus
                  onChange={e=>setNewFolderName(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&newFolderName.trim()){setShowCreateFolder(null);setNewFolderName("");}}} />
                <div style={{display:"flex",gap:10,marginTop:16,justifyContent:"flex-end"}}>
                  <button className="btn btn-secondary" onClick={()=>{setShowCreateFolder(null);setNewFolderName("");}}>Cancel</button>
                  <button className="btn btn-primary"
                    disabled={!newFolderName.trim()}
                    onClick={()=>{
                      if(!newFolderName.trim()) return;
                      const newPath=[...showCreateFolder,newFolderName.trim()];
                      createFolder(newPath);
                      setShowCreateFolder(null);
                      setNewFolderName("");
                    }}>
                    Create Folder
                  </button>
                </div>
                <div style={{fontSize:".75rem",color:"#aaa",marginTop:10}}>
                  Tip: folders appear automatically when you save a sheet into them.
                </div>
              </div>
            </div>
          )}

          {/* ── Move Sheet Modal ── */}
          {showMoveModal && (
            <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
              <div style={{background:"white",borderRadius:12,padding:28,maxWidth:480,width:"100%",maxHeight:"80vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(0,0,0,.2)"}}>
                <div style={{fontWeight:700,fontSize:"1rem",marginBottom:16}}>Move Sheet to Folder</div>
                {(() => {
                  const movingSheet = savedSheets.find(s=>s.key===showMoveModal);
                  const allPaths = getAllFolderPaths(savedSheets);
                  return (
                    <div>
                      <div style={{fontSize:".85rem",color:"#555",marginBottom:14}}>
                        Moving: <strong>{movingSheet?.clientName}</strong> — {movingSheet?.asOfDate}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
                        {/* Unfiled option */}
                        <div
                          onClick={()=>moveSheet(showMoveModal,[])}
                          style={{padding:"10px 14px",border:"1.5px solid #ddd",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:10,background:"#fafafa"}}
                          onMouseOver={e=>e.currentTarget.style.borderColor="#6B0E1E"}
                          onMouseOut={e=>e.currentTarget.style.borderColor="#ddd"}>
                          <span style={{fontSize:"1.2rem"}}>📋</span>
                          <span style={{fontSize:".9rem"}}>Unfiled (top level)</span>
                        </div>
                        {allPaths.filter(p=>p.length>0).map((path,i) => (
                          <div key={i}
                            onClick={()=>moveSheet(showMoveModal,path)}
                            style={{padding:"10px 14px",border:"1.5px solid #ddd",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:10,background:"#fafafa",paddingLeft:(path.length*16+14)+"px"}}
                            onMouseOver={e=>e.currentTarget.style.borderColor="#6B0E1E"}
                            onMouseOut={e=>e.currentTarget.style.borderColor="#ddd"}>
                            <span style={{fontSize:"1.1rem"}}>📁</span>
                            <span style={{fontSize:".9rem"}}>{path[path.length-1]}</span>
                            <span style={{fontSize:".75rem",color:"#aaa",marginLeft:"auto"}}>{path.join(" / ")}</span>
                          </div>
                        ))}
                        {/* Create new folder option */}
                        <div
                          onClick={()=>{setShowCreateFolder([]);setNewFolderName("");}}
                          style={{padding:"10px 14px",border:"1.5px dashed #6B0E1E",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:10,color:"#6B0E1E",background:"#fdf9f9"}}>
                          <span style={{fontSize:"1.1rem"}}>➕</span>
                          <span style={{fontSize:".9rem",fontWeight:600}}>Create new folder first...</span>
                        </div>
                      </div>
                      <button className="btn btn-secondary" onClick={()=>setShowMoveModal(null)}>Cancel</button>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {savedSheets.length === 0
            ? <div className="home-empty">No saved balance sheets yet. Complete a sheet and save it to store it here.</div>
            : (() => {
                // Build tree from folderPath on each sheet
                // Collect all unique folder paths
                const allPaths = getAllFolderPaths(savedSheets);
                // Build a recursive tree renderer
                function renderFolderLevel(pathPrefix, depth) {
                  const indent = depth * 20;
                  // Get child folder names at this level
                  const childFolders = allPaths
                    .filter(p => p.length === pathPrefix.length + 1 &&
                      p.slice(0, pathPrefix.length).join("|") === pathPrefix.join("|"))
                    .sort((a,b) => a[a.length-1].localeCompare(b[b.length-1]));
                  // Get sheets at this exact path
                  const sheetsHere = savedSheets
                    .filter(s => {
                      const fp = s.folderPath || [];
                      return fp.length === pathPrefix.length &&
                        fp.join("|") === pathPrefix.join("|");
                    })
                    .sort((a,b) => b.asOfDate.localeCompare(a.asOfDate));
                  const folderKey = pathPrefix.join("|") || "_root_";
                  const isOpen = pathPrefix.length === 0 ? true : !!openFolders[folderKey];
                  return (
                    <div key={folderKey} style={{marginLeft: depth > 0 ? indent + "px" : 0}}>
                      {/* Subfolder groups */}
                      {childFolders.map(path => {
                        const folderName = path[path.length-1];
                        const fKey = path.join("|");
                        const fOpen = !!openFolders[fKey];
                        const allSheetsInFolder = savedSheets.filter(s => {
                          const fp = s.folderPath || [];
                          return fp.length >= path.length && fp.slice(0,path.length).join("|") === path.join("|");
                        });
                        const latestInFolder = allSheetsInFolder.sort((a,b)=>b.asOfDate.localeCompare(a.asOfDate))[0];
                        return (
                          <div key={fKey} className="client-folder" style={{marginLeft: depth * 20 + "px", marginBottom:6}}>
                            <div className="client-folder-header" onClick={()=>toggleFolder(fKey)}>
                              <div className="client-folder-left" style={{flex:1,minWidth:0}}>
                                <span className="folder-icon">{fOpen ? "📂" : "📁"}</span>
                                {editingFolder && JSON.stringify(editingFolder.path)===JSON.stringify(path) ? (
                                  <div style={{display:"flex",alignItems:"center",gap:6,flex:1}} onClick={e=>e.stopPropagation()}>
                                    <input className="text-input"
                                      style={{flex:1,maxWidth:220,padding:"5px 10px",fontSize:".9rem"}}
                                      value={editingFolder.newName} autoFocus
                                      onChange={e=>setEditingFolder({...editingFolder,newName:e.target.value})}
                                      onKeyDown={e=>{
                                        if(e.key==="Enter") renameFolder(editingFolder.path, editingFolder.newName);
                                        if(e.key==="Escape") setEditingFolder(null);
                                      }} />
                                    <button className="btn btn-primary" style={{padding:"5px 12px",fontSize:".8rem"}}
                                      onClick={()=>renameFolder(editingFolder.path, editingFolder.newName)}>Save</button>
                                    <button className="btn btn-secondary" style={{padding:"5px 10px",fontSize:".8rem"}}
                                      onClick={()=>setEditingFolder(null)}>Cancel</button>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="client-folder-name">{folderName}</div>
                                    <div className="client-folder-meta">
                                      {allSheetsInFolder.length} sheet{allSheetsInFolder.length!==1?"s":""}
                                      {latestInFolder && " · Latest: " + latestInFolder.asOfDate}
                                      {path.length > 1 && <span style={{color:"#aaa",marginLeft:6}}>{path.join(" / ")}</span>}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="client-folder-right">
                                {(!editingFolder || JSON.stringify(editingFolder.path)!==JSON.stringify(path)) && (
                                  <span>
                                    <button style={{background:"none",border:"1px solid #e0d0d0",borderRadius:5,padding:"3px 7px",fontSize:".75rem",cursor:"pointer",color:"#888",fontFamily:"inherit",marginRight:4}}
                                      title="Rename folder"
                                      onClick={e=>{e.stopPropagation();setEditingFolder({path,newName:folderName});}}>
                                      Rename
                                    </button>
                                    <button style={{background:"none",border:"1px solid #ddd",borderRadius:5,padding:"3px 8px",fontSize:".72rem",cursor:"pointer",color:"#6B0E1E",fontFamily:"inherit",fontWeight:600,marginRight:4}}
                                      onClick={e=>{e.stopPropagation();setShowCreateFolder(path);setNewFolderName("");}}>
                                      + Sub
                                    </button>
                                    {latestInFolder && (
                                      <button className="sheet-load-btn"
                                        onClick={e=>{e.stopPropagation();loadSheet(latestInFolder.key);}}>
                                        Open Latest
                                      </button>
                                    )}
                                  </span>
                                )}
                                <span className="folder-chevron">{fOpen ? "▲" : "▼"}</span>
                              </div>
                            </div>
                            {fOpen && renderFolderLevel(path, 1)}
                          </div>
                        );
                      })}
                      {/* Sheets at this level */}
                      {sheetsHere.length > 0 && (
                        <div className={depth > 0 ? "client-folder-sheets" : ""} style={{display:"flex",flexDirection:"column",gap:6}}>
                          {sheetsHere.map(s => (
                            <div key={s.key} className="sheet-card sheet-card-nested"
                              onClick={()=>loadSheet(s.key)}>
                              <div className="sheet-icon" style={{fontSize:"1.2rem"}}>📋</div>
                              <div className="sheet-info">
                                <div style={{fontSize:".9rem",fontWeight:700,color:"#1a1a1a"}}>{s.clientName}</div>
                                <div className="sheet-date">As of {s.asOfDate}</div>
                                {s.savedAt && <div className="sheet-meta">Saved {new Date(s.savedAt).toLocaleDateString()}</div>}
                              </div>
                              <button className="sheet-load-btn"
                                onClick={e=>{e.stopPropagation();loadSheet(s.key);}}>
                                Open
                              </button>
                              <button style={{background:"none",border:"1px solid #ddd",borderRadius:5,padding:"4px 8px",fontSize:".75rem",cursor:"pointer",color:"#555",fontFamily:"inherit"}}
                                onClick={e=>{e.stopPropagation();setShowMoveModal(s.key);}}>
                                Move
                              </button>
                              <button className="sheet-delete" onClick={e=>deleteSheet(s.key,e)}>Delete</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return renderFolderLevel([], 0);
              })()
          }
        </div>
      </div>
    );
  }

  // ── Wizard / Budget / Compare ──────────────────────────────────────────────
  return (
    <div className="app">

      {/* ── Save Folder Picker Modal ── */}
      {showSaveFolderPicker && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"white",borderRadius:14,padding:28,maxWidth:500,width:"100%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 10px 50px rgba(0,0,0,.25)"}}>
            <div style={{fontWeight:700,fontSize:"1.05rem",marginBottom:6}}>Save Balance Sheet</div>
            <div style={{fontSize:".85rem",color:"#666",marginBottom:18}}>
              Choose a folder for <strong>{data.clientName}</strong> — {data.asOfDate}
            </div>
            {/* New folder name input */}
            {showCreateFolder !== null && (
              <div style={{background:"#f0f6ff",border:"1px solid #c0d8f0",borderRadius:8,padding:14,marginBottom:14}}>
                <div style={{fontSize:".82rem",fontWeight:700,color:"#2d5a8e",marginBottom:8}}>
                  New folder {showCreateFolder.length>0 ? "inside "+showCreateFolder[showCreateFolder.length-1] : "(top level)"}:
                </div>
                <div style={{display:"flex",gap:8}}>
                  <input className="text-input" type="text" value={newFolderName} autoFocus
                    placeholder="Folder name..."
                    onChange={e=>setNewFolderName(e.target.value)}
                    onKeyDown={e=>{
                      if(e.key==="Enter"&&newFolderName.trim()){
                        const newPath=[...showCreateFolder,newFolderName.trim()];
                        createFolder(newPath);
                        setSelectedFolderPath(newPath);
                        setShowCreateFolder(null);
                        setNewFolderName("");
                      }
                    }} />
                  <button className="btn btn-primary" style={{flexShrink:0}}
                    disabled={!newFolderName.trim()}
                    onClick={()=>{
                      if(!newFolderName.trim()) return;
                      const newPath=[...showCreateFolder,newFolderName.trim()];
                      createFolder(newPath);
                      setSelectedFolderPath(newPath);
                      setShowCreateFolder(null);
                      setNewFolderName("");
                    }}>
                    Create
                  </button>
                  <button className="btn btn-secondary" style={{flexShrink:0}}
                    onClick={()=>{setShowCreateFolder(null);setNewFolderName("");}}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:16}}>
              {/* Unfiled */}
              <div
                onClick={()=>setSelectedFolderPath([])}
                style={{padding:"10px 14px",border:"1.5px solid "+(selectedFolderPath.length===0?"#6B0E1E":"#ddd"),borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:10,background:selectedFolderPath.length===0?"#f5e8ea":"#fafafa"}}>
                <span style={{fontSize:"1.1rem"}}>📋</span>
                <span style={{fontSize:".9rem",fontWeight:selectedFolderPath.length===0?700:400}}>Unfiled</span>
                {selectedFolderPath.length===0 && <span style={{marginLeft:"auto",fontSize:".75rem",color:"#6B0E1E",fontWeight:700}}>Selected</span>}
              </div>
              {/* Existing folders */}
              {getAllFolderPaths(savedSheets).filter(p=>p.length>0).sort((a,b)=>a.join("/").localeCompare(b.join("/"))).map((path,i) => {
                const isSelected = JSON.stringify(selectedFolderPath)===JSON.stringify(path);
                return (
                  <div key={i}
                    onClick={()=>setSelectedFolderPath(path)}
                    style={{padding:"10px 14px",border:"1.5px solid "+(isSelected?"#6B0E1E":"#ddd"),borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:10,paddingLeft:(path.length*16+14)+"px",background:isSelected?"#f5e8ea":"#fafafa"}}>
                    <span style={{fontSize:"1.1rem"}}>{isSelected?"📂":"📁"}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:".9rem",fontWeight:isSelected?700:400}}>{path[path.length-1]}</div>
                      {path.length>1&&<div style={{fontSize:".72rem",color:"#aaa"}}>{path.join(" / ")}</div>}
                    </div>
                    {isSelected && <span style={{fontSize:".75rem",color:"#6B0E1E",fontWeight:700}}>Selected</span>}
                    <button style={{background:"none",border:"1px solid #ddd",borderRadius:5,padding:"2px 7px",fontSize:".7rem",cursor:"pointer",color:"#6B0E1E",fontFamily:"inherit",flexShrink:0}}
                      onClick={e=>{e.stopPropagation();setShowCreateFolder(path);setNewFolderName("");}}>
                      + Sub
                    </button>
                  </div>
                );
              })}
              {/* Create new top-level folder */}
              <div
                onClick={()=>{setShowCreateFolder([]);setNewFolderName("");}}
                style={{padding:"10px 14px",border:"1.5px dashed #6B0E1E",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:10,color:"#6B0E1E",background:"#fdf9f9"}}>
                <span style={{fontSize:"1.1rem"}}>➕</span>
                <span style={{fontSize:".9rem",fontWeight:600}}>Create new folder...</span>
              </div>
            </div>
            {selectedFolderPath.length > 0 && (
              <div style={{fontSize:".82rem",color:"#6B0E1E",fontWeight:600,marginBottom:12,padding:"6px 10px",background:"#f5e8ea",borderRadius:6}}>
                Saving to: {selectedFolderPath.join(" / ")}
              </div>
            )}
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button className="btn btn-secondary" onClick={()=>{setShowSaveFolderPicker(false);setPendingSaveKey(null);}}>Cancel</button>
              <button className="btn btn-save"
                onClick={()=>{
                  const fp = [...selectedFolderPath];
                  setShowSaveFolderPicker(false);
                  if(pendingSaveKey) doSave(pendingSaveKey, fp);
                }}>
                Save Here
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Overwrite Confirmation Modal ── */}
      {confirmSave && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"white",borderRadius:12,padding:32,maxWidth:420,width:"90%",boxShadow:"0 8px 40px rgba(0,0,0,.2)"}}>
            <div style={{fontSize:"1.1rem",fontWeight:700,color:"#1a1a1a",marginBottom:12}}>
              Update Existing Balance Sheet?
            </div>
            <div style={{fontSize:".9rem",color:"#555",marginBottom:24,lineHeight:1.6}}>
              A balance sheet for <strong>{confirmSave.label}</strong> is already saved.
              Do you want to overwrite it with the current data?
            </div>
            <div style={{display:"flex",gap:12,justifyContent:"flex-end"}}>
              <button className="btn btn-secondary"
                onClick={() => setConfirmSave(null)}>
                Cancel
              </button>
              <button className="btn btn-save"
                onClick={() => doSave(confirmSave.key)}>
                Yes, Update It
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="top-bar">
        <button onClick={()=>setScreen("home")} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",color:"white",borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:".8rem",fontFamily:"inherit",marginRight:8}}>
          Clients
        </button>
        <span className="bank-name">First Bank of Montana</span>
        <span className="divider">|</span>
        <span className="tool-name">Agricultural Financial Tools</span>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
          {data.clientName && <span style={{opacity:.8,fontSize:".85rem"}}>{data.clientName}</span>}
          {session?.user?.email && <span style={{fontSize:".78rem",color:"rgba(255,255,255,.65)"}}>{profile?.full_name||session.user.email}{profile?.role==="admin"&&<span style={{marginLeft:4,background:"rgba(255,255,255,.2)",padding:"1px 6px",borderRadius:999,fontSize:10,fontWeight:700}}>ADMIN</span>}</span>}
          <button onClick={async()=>{await supaLogout();setSession(null);setProfile(null);setScreen("home");setData(emptyData());}} style={{background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.25)",color:"rgba(255,255,255,.8)",borderRadius:5,padding:"4px 10px",cursor:"pointer",fontSize:".75rem",fontFamily:"inherit"}}>Sign Out</button>
        </div>
      </div>

      <div className="tab-bar">
        <button className={"tab-btn" + (activeTab === "balance" ? " tab-active" : "")}
          onClick={()=>setActiveTab("balance")}>
          Balance Sheet
        </button>
        <button className={"tab-btn" + (activeTab === "budget" ? " tab-active" : "")}
          onClick={()=>{setActiveTab("budget");loadCorpPersonalDebt();}}>
          Budget / Cash Flow
        </button>
        <button className={"tab-btn" + (activeTab === "compare" ? " tab-active" : "")}
          onClick={()=>{setActiveTab("compare");loadComparisonSheets();}}>
          Year Comparison
        </button>
        <button className={"tab-btn" + (activeTab === "inspection" ? " tab-active" : "")}
          onClick={()=>setActiveTab("inspection")}>
          🌾 Ag Inspection
        </button>
      </div>

      {activeTab === "balance" && (
        <div>
          <div className="progress-bar-wrap">
            <div className="progress-label">Step {step+1} of {STEPS.length}</div>
            <div className="progress-track">
              <div className="progress-fill" style={{width:progressPct+"%"}} />
            </div>
          </div>
          <div className="main">
            <div className="sidebar">
              <div className="sidebar-section">
                <div className="sidebar-section-label">Setup</div>
                {["intro"].map(s => {
                  const idx = STEPS.indexOf(s);
                  const cls = "sidebar-item" + (currentStepId === s ? " active" : idx < step ? " done" : "");
                  return <div key={s} className={cls} onClick={()=>setStep(idx)}>{STEP_LABELS[s]}</div>;
                })}
              </div>
              <div className="sidebar-section">
                <div className="sidebar-section-label">Assets</div>
                {ASSET_STEPS.map(s => {
                  const idx = STEPS.indexOf(s);
                  const cls = "sidebar-item" + (currentStepId === s ? " active" : idx < step ? " done" : "");
                  return <div key={s} className={cls} onClick={()=>setStep(idx)}>{STEP_LABELS[s]}</div>;
                })}
              </div>
              <div className="sidebar-section">
                <div className="sidebar-section-label">Liabilities</div>
                {["liab_intro",...LIAB_STEPS].map(s => {
                  const idx = STEPS.indexOf(s);
                  const cls = "sidebar-item" + (currentStepId === s ? " active" : idx < step ? " done" : "");
                  return <div key={s} className={cls} onClick={()=>setStep(idx)}>{STEP_LABELS[s]}</div>;
                })}
              </div>
              <div className="sidebar-section">
                <div className="sidebar-section-label">Finish</div>
                {["summary"].map(s => {
                  const idx = STEPS.indexOf(s);
                  const cls = "sidebar-item" + (currentStepId === s ? " active" : idx < step ? " done" : "");
                  return <div key={s} className={cls} onClick={()=>setStep(idx)}>{STEP_LABELS[s]}</div>;
                })}
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <div className="card-nav">
                  <button className="btn btn-secondary" onClick={prev} disabled={step === 0}>Back</button>
                  <span className="step-info">{step+1} / {STEPS.length}</span>
                  {step < STEPS.length - 1
                    ? <button className="btn btn-primary" onClick={next}>Next</button>
                    : <button className="btn btn-success" onClick={handlePrint}>Print Balance Sheet</button>
                  }
                </div>
                <div className="card-content">{renderStep()}</div>
              </div>
            </div>
            <div className="right-panel">
              <RunningTotal assets={totalAssets} liabilities={totalLiabilities} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "budget" && (
        <div className="budget-page">
          <div className="budget-top-bar">
            <div className="budget-client">{data.clientName || "Client Budget"} — {data.asOfDate}</div>
            <div className="budget-top-totals">
              <div className="btt-item"><span>Income</span><strong style={{color:"#1a5c25"}}>{fmt(budgetTotalIncome)}</strong></div>
              <div className="btt-item"><span>Expenses</span><strong style={{color:"#c44"}}>{fmt(budgetTotalExpenses + corpPersonalDebt.filter(r=>r.annualPmt&&numVal(r.annualPmt)>0).reduce((s,r)=>s+numVal(r.annualPmt),0))}</strong></div>
              <div className="btt-item btt-net"><span>Net</span>
                <strong style={{color:(budgetTotalIncome - budgetTotalExpenses - corpPersonalDebt.filter(r=>r.annualPmt&&numVal(r.annualPmt)>0).reduce((s,r)=>s+numVal(r.annualPmt),0))>=0?"#1a5c25":"#c44"}}>
                  {fmt(budgetTotalIncome - budgetTotalExpenses - corpPersonalDebt.filter(r=>r.annualPmt&&numVal(r.annualPmt)>0).reduce((s,r)=>s+numVal(r.annualPmt),0))}
                </strong>
              </div>
            </div>
            <button className="btn btn-save" onClick={saveSheet}
              disabled={!data.clientName || saveStatus === "saving"}>
              {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : saveStatus && saveStatus !== "error" ? "Error: " + saveStatus.slice(0,60) : "Save"}
            </button>
            <button className="btn btn-secondary" onClick={handlePrintBudget}
              style={{fontSize:".85rem"}}>
              Print Budget
            </button>
            <button onClick={()=>setShowPriceList(true)}
              style={{background:"none",border:"1.5px solid #6B0E1E",borderRadius:6,padding:"5px 12px",color:"#6B0E1E",fontWeight:700,fontSize:".78rem",cursor:"pointer",fontFamily:"inherit"}}>
              📋 Price List
            </button>
            <button onClick={()=>setShowExpenseEditor(true)}
              style={{background:"none",border:"1.5px solid #2d5a8e",borderRadius:6,padding:"5px 12px",color:"#2d5a8e",fontWeight:700,fontSize:".78rem",cursor:"pointer",fontFamily:"inherit"}}>
              📝 Expense List
            </button>
            <button onClick={generateBudgetShare}
              style={{background:"#2d5a8e",color:"white",border:"none",borderRadius:6,padding:"5px 12px",fontWeight:700,fontSize:".78rem",cursor:"pointer",fontFamily:"inherit"}}>
              🔗 Share with Customer
            </button>
            <button className="btn btn-secondary" onClick={()=>setShowShareBudget(true)}
              style={{fontSize:".85rem",background:"#1B4332",color:"white",border:"none"}}>
              📧 Share with Customer
            </button>
          </div>
          <div className="budget-body">
            <BudgetView
              data={data}
              budgetCropTotal={budgetCropTotal}
              budgetLivestockTotal={budgetLivestockTotal}
              budgetMiscTotal={budgetMiscTotal}
              budgetTotalIncome={budgetTotalIncome}
              budgetOperatingExpenses={budgetOperatingExpenses}
              debtServiceTerms={debtServiceTerms}
              debtServiceRE={debtServiceRE}
              debtServiceTermsPersonal={debtServiceTermsPersonal}
              debtServiceTermsCorp={debtServiceTermsCorp}
              debtServiceREPersonal={debtServiceREPersonal}
              debtServiceRECorp={debtServiceRECorp}
              budgetTotalDebtService={budgetTotalDebtService}
              budgetPersonalDebtTotal={budgetPersonalDebtTotal}
              budgetCorpDebtTotal={budgetCorpDebtTotal}
              corpPersonalDebt={corpPersonalDebt}
              corpPersonalDebtTotal={corpPersonalDebt.filter(r=>r.annualPmt&&numVal(r.annualPmt)>0).reduce((s,r)=>s+numVal(r.annualPmt),0)}
              budgetTotalExpenses={budgetTotalExpenses}
              budgetNetIncome={budgetNetIncome}
              setArr={setArr}
              removeRow={removeRow}
              addRow={addRow}
              lookupPrice={lookupPrice}
              commodityPrices={commodityPrices}
            />
          </div>
        </div>
      )}

      {activeTab === "compare" && (
        <div className="comp-page">
          <div className="comp-page-header">
            <div>
              <div className="comp-page-title">{data.clientName} — Year-over-Year Comparison</div>
              <div className="comp-page-sub">{compSheets.length} balance sheet{compSheets.length !== 1 ? "s" : ""} on file</div>
            </div>
            <button className="btn btn-secondary" onClick={loadComparisonSheets} style={{fontSize:".82rem"}}>Refresh</button>
          </div>
          <div className="comp-scroll">
            <ComparisonView
              compSheets={compSheets}
              compLoading={compLoading}
              compInsight={compInsight}
              compInsightLoading={compInsightLoading}
              generateInsights={generateInsights}
              clientName={data.clientName}
              SECTION_BREAKS={SECTION_BREAKS}
              SECTION_HEADERS={SECTION_HEADERS}
              BOLD_ROWS={BOLD_ROWS}
            />
          </div>
        </div>
      )}

      {showPriceList && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"white",borderRadius:14,padding:28,maxWidth:620,width:"100%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 10px 50px rgba(0,0,0,.25)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <div style={{fontWeight:700,fontSize:"1.05rem",color:"#1a1a1a"}}>Commodity Price List</div>
                <div style={{fontSize:".75rem",color:"#888",marginTop:2}}>
                  First Bank of Montana · Prices auto-fill on the Budget tab · Edit any price to update
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{
                  const newId = commodityPrices.length;
                  const updated = [...commodityPrices,{id:newId,category:"Crops",name:"",price:"",unit:"bu"}];
                  setCommodityPrices(updated); saveCommodityPrices(updated);
                }} style={{background:"none",border:"1.5px solid #6B0E1E",borderRadius:6,padding:"4px 12px",color:"#6B0E1E",fontWeight:700,fontSize:".78rem",cursor:"pointer",fontFamily:"inherit"}}>
                  + Add
                </button>
                <button onClick={()=>{
                  if(window.confirm("Reset to FBMT default prices? Your edits will be lost.")) {
                    const defaults = DEFAULT_COMMODITY_PRICES.map((p,i)=>({...p,id:i}));
                    setCommodityPrices(defaults); saveCommodityPrices(defaults);
                  }
                }} style={{background:"none",border:"1px solid #ddd",borderRadius:6,padding:"4px 12px",color:"#888",fontSize:".75rem",cursor:"pointer",fontFamily:"inherit"}}>
                  Reset to Defaults
                </button>
                <button onClick={()=>setShowPriceList(false)}
                  style={{background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer",color:"#888",lineHeight:1}}>×</button>
              </div>
            </div>
            {["Crops","Livestock"].map(cat => (
              <div key={cat} style={{marginBottom:16}}>
                <div style={{background:"#6B0E1E",color:"white",fontWeight:700,fontSize:".8rem",padding:"6px 12px",borderRadius:"6px 6px 0 0",letterSpacing:".05em",textTransform:"uppercase"}}>
                  {cat}
                </div>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:".85rem"}}>
                  <thead>
                    <tr style={{background:"#f5f0f0"}}>
                      <th style={{padding:"7px 12px",textAlign:"left",fontWeight:700,color:"#555",fontSize:".75rem",textTransform:"uppercase",letterSpacing:".04em"}}>Commodity</th>
                      <th style={{padding:"7px 12px",textAlign:"right",fontWeight:700,color:"#555",fontSize:".75rem",textTransform:"uppercase",letterSpacing:".04em"}}>Price</th>
                      <th style={{padding:"7px 12px",textAlign:"center",fontWeight:700,color:"#555",fontSize:".75rem",textTransform:"uppercase",letterSpacing:".04em"}}>Unit</th>
                      <th style={{width:36}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {commodityPrices.filter(p=>p.category===cat).map((p,i)=>(
                      <tr key={p.id} style={{borderBottom:"1px solid #f0f0f0",background:i%2===0?"white":"#fafafa"}}>
                        <td style={{padding:"6px 12px"}}>
                          <input type="text" value={p.name}
                            onChange={e=>updateCommodityPrice(p.id,"name",e.target.value)}
                            style={{border:"1px solid #e0e0e0",borderRadius:4,padding:"4px 8px",fontSize:".85rem",width:"100%",fontFamily:"inherit",outline:"none"}} />
                        </td>
                        <td style={{padding:"6px 12px"}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:4}}>
                            <span style={{color:"#888",fontSize:".85rem"}}>$</span>
                            <input type="text" value={p.price}
                              onChange={e=>updateCommodityPrice(p.id,"price",e.target.value.replace(/[^0-9.]/g,""))}
                              style={{border:"1px solid #e0e0e0",borderRadius:4,padding:"4px 8px",fontSize:".9rem",width:80,textAlign:"right",fontFamily:"inherit",outline:"none",fontWeight:700,color:"#6B0E1E"}} />
                          </div>
                        </td>
                        <td style={{padding:"6px 12px",textAlign:"center"}}>
                          <select value={p.unit} onChange={e=>updateCommodityPrice(p.id,"unit",e.target.value)}
                            style={{border:"1px solid #e0e0e0",borderRadius:4,padding:"4px 6px",fontSize:".8rem",fontFamily:"inherit",outline:"none",background:"white"}}>
                            {["bu","lb","ton","cwt","bale","hd"].map(u=><option key={u}>{u}</option>)}
                          </select>
                        </td>
                        <td style={{padding:"4px 8px",textAlign:"center"}}>
                          <button onClick={()=>{
                            const updated = commodityPrices.filter(x=>x.id!==p.id);
                            setCommodityPrices(updated); saveCommodityPrices(updated);
                          }} style={{background:"#fee2e2",color:"#b91c1c",border:"none",borderRadius:4,padding:"2px 7px",cursor:"pointer",fontSize:12}}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            <div style={{fontSize:".72rem",color:"#aaa",marginTop:8}}>
              Changes save automatically · Prices marked "list price" on the Budget tab are pulled from this list
            </div>
          </div>
        </div>
      )}

      {showExpenseEditor && (
        <ExpenseListEditor
          expenseList={expenseList}
          setExpenseList={setExpenseList}
          onClose={()=>setShowExpenseEditor(false)}
        />
      )}

      {/* ── Balance Sheet Share Modal ── */}
      {showBSShareModal && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"white",borderRadius:14,padding:28,maxWidth:480,width:"100%",boxShadow:"0 10px 50px rgba(0,0,0,.25)"}}>
            <div style={{fontWeight:700,fontSize:"1.05rem",marginBottom:6,color:"#1a1a1a"}}>Share Balance Sheet with Customer</div>
            {bsShareStatus==='generating'&&<div style={{color:"#6b7280",padding:"20px 0",textAlign:"center"}}>Generating secure link...</div>}
            {bsShareStatus==='ready'&&(
              <div>
                <div style={{fontSize:".85rem",color:"#555",marginBottom:16}}>Send the link and PIN below to your customer. They can review and edit all figures, save their progress, and submit back to you. The link expires in <strong>14 days</strong>.</div>
                <div style={{background:"#f0f6ff",border:"1px solid #c0d8f0",borderRadius:8,padding:14,marginBottom:12}}>
                  <div style={{fontSize:".72rem",fontWeight:700,color:"#2d5a8e",marginBottom:4,textTransform:"uppercase",letterSpacing:".05em"}}>Share Link</div>
                  <div style={{fontSize:".82rem",wordBreak:"break-all",color:"#1a1a1a",fontFamily:"monospace",marginBottom:8}}>{bsShareLink}</div>
                  <button onClick={()=>navigator.clipboard.writeText(bsShareLink).then(()=>alert('Copied!'))} style={{background:"#2d5a8e",color:"white",border:"none",borderRadius:5,padding:"4px 10px",fontSize:".75rem",cursor:"pointer",fontWeight:600}}>Copy Link</button>
                </div>
                <div style={{background:"#f5e8ea",border:"1px solid #e0b0b8",borderRadius:8,padding:14,marginBottom:14}}>
                  <div style={{fontSize:".72rem",fontWeight:700,color:"#6B0E1E",marginBottom:4,textTransform:"uppercase",letterSpacing:".05em"}}>Customer PIN</div>
                  <div style={{fontSize:"2rem",fontWeight:900,letterSpacing:".25em",color:"#6B0E1E",fontFamily:"monospace"}}>{bsSharePin}</div>
                  <div style={{fontSize:".72rem",color:"#888",marginTop:4}}>Customer must enter this to open the form</div>
                </div>
                <button onClick={()=>{const s=encodeURIComponent(`Balance Sheet Review - ${data.clientName}`);const b=encodeURIComponent(`Hello,\n\nPlease review and complete your balance sheet using the secure link below.\n\nLink: ${bsShareLink}\n\nYour PIN: ${bsSharePin}\n\nYou can save your progress and come back anytime. The link expires in 14 days.\n\nThank you,\nFirst Bank of Montana`);window.location.href='mailto:?subject='+s+'&body='+b;}} style={{width:"100%",background:"#6B0E1E",color:"white",border:"none",borderRadius:7,padding:"10px 0",fontWeight:700,fontSize:".9rem",cursor:"pointer",marginBottom:8}}>📧 Open in Email</button>
              </div>
            )}
            {bsShareStatus.startsWith('error')&&<div style={{color:"#c44",fontSize:".85rem",padding:"12px 0"}}>Error: {bsShareStatus.slice(6)}<br/><span style={{fontSize:".75rem",color:"#888"}}>Make sure you ran customer-shares-schema.sql in Supabase.</span></div>}
            <button onClick={()=>setShowBSShareModal(false)} style={{background:"none",border:"1px solid #ddd",borderRadius:6,padding:"7px 20px",cursor:"pointer",fontFamily:"inherit",fontSize:".85rem",marginTop:4}}>Close</button>
          </div>
        </div>
      )}

      {/* ── Budget Share Modal ── */}
      {showBudgetShareModal && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"white",borderRadius:14,padding:28,maxWidth:480,width:"100%",boxShadow:"0 10px 50px rgba(0,0,0,.25)"}}>
            <div style={{fontWeight:700,fontSize:"1.05rem",marginBottom:6,color:"#1a1a1a"}}>Share Budget Form with Customer</div>
            {budgetShareStatus==='generating'&&<div style={{color:"#6b7280",padding:"20px 0",textAlign:"center"}}>Generating secure link...</div>}
            {budgetShareStatus==='ready'&&(
              <div>
                <div style={{fontSize:".85rem",color:"#555",marginBottom:16}}>The customer will see a blank budget form with your pre-loaded expense list. They fill in their own income and expenses. Link expires in <strong>14 days</strong>.</div>
                <div style={{background:"#f0f6ff",border:"1px solid #c0d8f0",borderRadius:8,padding:14,marginBottom:12}}>
                  <div style={{fontSize:".72rem",fontWeight:700,color:"#2d5a8e",marginBottom:4,textTransform:"uppercase",letterSpacing:".05em"}}>Share Link</div>
                  <div style={{fontSize:".82rem",wordBreak:"break-all",color:"#1a1a1a",fontFamily:"monospace",marginBottom:8}}>{budgetShareLink}</div>
                  <button onClick={()=>navigator.clipboard.writeText(budgetShareLink).then(()=>alert('Copied!'))} style={{background:"#2d5a8e",color:"white",border:"none",borderRadius:5,padding:"4px 10px",fontSize:".75rem",cursor:"pointer",fontWeight:600}}>Copy Link</button>
                </div>
                <div style={{background:"#f5e8ea",border:"1px solid #e0b0b8",borderRadius:8,padding:14,marginBottom:14}}>
                  <div style={{fontSize:".72rem",fontWeight:700,color:"#6B0E1E",marginBottom:4,textTransform:"uppercase",letterSpacing:".05em"}}>Customer PIN</div>
                  <div style={{fontSize:"2rem",fontWeight:900,letterSpacing:".25em",color:"#6B0E1E",fontFamily:"monospace"}}>{budgetSharePin}</div>
                </div>
                <button onClick={()=>{const s=encodeURIComponent(`Budget Form - ${data.clientName}`);const b=encodeURIComponent(`Hello,\n\nPlease complete your agricultural budget using the secure link below.\n\nLink: ${budgetShareLink}\n\nYour PIN: ${budgetSharePin}\n\nYou can save your progress and come back anytime. The link expires in 14 days.\n\nThank you,\nFirst Bank of Montana`);window.location.href='mailto:?subject='+s+'&body='+b;}} style={{width:"100%",background:"#6B0E1E",color:"white",border:"none",borderRadius:7,padding:"10px 0",fontWeight:700,fontSize:".9rem",cursor:"pointer",marginBottom:8}}>📧 Open in Email</button>
              </div>
            )}
            {budgetShareStatus.startsWith('error')&&<div style={{color:"#c44",fontSize:".85rem",padding:"12px 0"}}>Error: {budgetShareStatus.slice(6)}</div>}
            <button onClick={()=>setShowBudgetShareModal(false)} style={{background:"none",border:"1px solid #ddd",borderRadius:6,padding:"7px 20px",cursor:"pointer",fontFamily:"inherit",fontSize:".85rem",marginTop:4}}>Close</button>
          </div>
        </div>
      )}

      {showShareBudget && (
        <ShareBudgetModal
          data={data}
          budgetTotalIncome={budgetTotalIncome}
          budgetTotalExpenses={budgetTotalExpenses}
          budgetCropTotal={budgetCropTotal}
          budgetLivestockTotal={budgetLivestockTotal}
          budgetMiscTotal={budgetMiscTotal}
          budgetOperatingExpenses={budgetOperatingExpenses}
          budgetTotalDebtService={budgetTotalDebtService}
          onClose={()=>setShowShareBudget(false)}
        />
      )}

      {activeTab === "inspection" && (
        <div>
          {hasCustomerResponse && (
            <div style={{background:"#e8f5ea",border:"1px solid #22c55e",borderRadius:10,
              padding:"14px 18px",margin:"12px 12px 0",display:"flex",alignItems:"center",
              gap:12,flexWrap:"wrap"}}>
              <span style={{fontSize:"1.3rem"}}>📬</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:".9rem",color:"#15803d"}}>
                  Customer has submitted their inspection form!
                </div>
                <div style={{fontSize:".78rem",color:"#555"}}>
                  Click Load Response to pull their answers into the inspection form below.
                </div>
              </div>
              <button
                onClick={()=>{
                  const sid = data.inspShareId;
                  if (!sid) return;
                  fetch(SUPABASE_URL+'/rest/v1/inspection_shares?share_id=eq.'+sid+'&select=response',
                    {headers:supaHeaders()})
                    .then(r=>r.json())
                    .then(rows=>{
                      if (!rows[0]?.response) return;
                      const cr = rows[0].response;
                      setData(d=>({...d,
                        inspCrops:(d.inspCrops||[]).map((r,i)=>({...r,
                          actualAcres:cr.crops?.[i]?.actualAcres||r.actualAcres,
                          condition:cr.crops?.[i]?.condition||r.condition,
                          actualYield:cr.crops?.[i]?.actualYield||r.actualYield,
                          location:cr.crops?.[i]?.location||r.location,
                          deviationReason:cr.crops?.[i]?.deviationReason||r.deviationReason,
                        })),
                        inspLivestock:(d.inspLivestock||[]).map((r,i)=>({...r,
                          actualHead:cr.livestock?.[i]?.actualHead||r.actualHead,
                          condition:cr.livestock?.[i]?.condition||r.condition,
                          estWeight:cr.livestock?.[i]?.estWeight||r.estWeight,
                        })),
                      }));
                      setHasCustomerResponse(false);
                    });
                }}
                style={{background:"#15803d",color:"white",border:"none",borderRadius:7,
                  padding:"8px 16px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                  fontSize:".85rem",flexShrink:0}}>
                Load Response
              </button>
            </div>
          )}
          <InspectionView data={data} setData={setData} />
        </div>
      )}
    </div>
  );
}
