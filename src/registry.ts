// import {
//   DataTypeNoArgs,
//   DataTypeStringArg,
//   resolveExtensionConverter,
//   createConverter,
//   URLDataType,
//   relativeNestedDataType,
//   resolveDataType,
//   URLTemplate
// } from "@jupyterlab/dataregistry";
// import {
//     IRegistry,
//     widgetDataType,
//     CSVDataType
// } from "@jupyterlab/dataregistry-extension";
// import { Observable, throwError, merge, defer, BehaviorSubject } from "rxjs";
// import { distinct, switchMap, map } from "rxjs/operators";
// import { fromFetch } from "rxjs/fetch";
// import { SpreadsheetModel } from "./model";
// import { SpreadsheetWidget } from "./widget";

/**
 * Mimetype for old-style (pre-2003) Excel format workbooks.
 *
 * These files have the extension ".xls"
 */
export const XLS_MIMETYPE = "application/vnd.ms-excel";

/**
 * Mimetype for XML-based Excel and SpreadsheetML workbooks.
 *
 * These files have the extension ".xlsx"
 */
export const XLSX_MIMETYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Mimetype for OpenOffice and LibreOffice spreadsheets.
 * 
 * These files have the extension ".ods"
 */
export const ODF_MIMETYPE =
  "application/vnd.oasis.opendocument.spreadsheet";

/**
 * Mimetype for JSON-based Common Spreadsheet Format workbooks.
 *
 * No standard file extension exists for this format, it is merely a glorified
 * JSON schema. These workbooks are produced by the SheetJS library.
 *
 * For more information, see
 * {@link https://docs.sheetjs.com/#common-spreadsheet-format | the CSF docs}.
 *
 */
export const CSF_MIMETYPE = "application/vnd.sheetjs.csf+json";

// /**
//  * A datatype for Common Workbook Format spreadsheets.
//  *
//  * jupyterlab-spreadsheet parses Excel workbooks into this format, and all
//  * UI components work on CWF.
//  */
// export const SheetJsWorkbookDataType = new DataTypeNoArgs<SpreadsheetModel>(
//   CSF_MIMETYPE
// );

// /**
//  * A datatype that points into a sheet inside a workbook.
//  *
//  * Remember that a single Excel workbook can have many different sheets- to get
//  * a table, it is not enough to simply point at an xlsx file.
//  */
// const SheetJsDataType = new DataTypeStringArg<SpreadsheetModel>(
//   CSF_MIMETYPE,
//   "worksheet"
// );

// /** A datatype for shuttling Base64 around, much like the textDataType */
// const Base64DataType = new DataTypeStringArg<Observable<string>>(
//   "application/octet-stream",
//   "mimetype"
// );

// /**
//  * Register converters for ExcelSpreadsheets with a given Data Registry.
//  *
//  * @param registry The registry to hook into
//  */
// export function registerConverters(registry: IRegistry) {
//   registry.addConverter(
//     resolveExtensionConverter(".xls", XLS_MIMETYPE),
//     resolveExtensionConverter(".xlsx", XLSX_MIMETYPE),
//     // A converter to go between URLs and Base64 data
//     createConverter(
//       {
//         from: URLDataType,
//         to: Base64DataType
//       },
//       ({ data, type }) => ({
//         type: type,
//         data: data.pipe(
//           distinct(),
//           switchMap(i => fromFetch(i)),
//           switchMap(i => {
//             if (!i.ok) {
//               return throwError(new Error("Bad response:" + i));
//             }
//             return i.blob().then(
//               blob =>
//                 new Promise((res, rej) => {
//                   // don't you love how most DOM APIs are
//                   // constructed entirely out of duct tape?
//                   const reader = new FileReader();
//                   reader.onerror = rej;
//                   reader.onload = () => {
//                     const result = reader.result;
//                     if (result == null || reader instanceof ArrayBuffer) {
//                       return rej("Failed to load data");
//                     }
//                     res(("" + result).replace(/^data:[^;]+;base64,/, ""));
//                   };
//                   reader.readAsDataURL(blob);
//                 })
//             );
//           })
//         )
//       })
//     ),
//     createConverter(
//       {
//         from: Base64DataType,
//         to: SheetJsWorkbookDataType
//       },
//       ({ type, data }) => {
//         if (!(type === XLS_MIMETYPE || type === XLSX_MIMETYPE)) {
//           return null;
//         }

//         return {
//           type: void 0,
//           data: new SpreadsheetModel({ value: data })
//         };
//       }
//     ),
//     createConverter(
//       {
//         from: SheetJsWorkbookDataType,
//         to: widgetDataType
//       },
//       ({ data }) => {
//         return {
//           type: "Spreadsheet",
//           data: () => new SpreadsheetWidget({ model: data })
//         };
//       }
//     ),
//     createConverter(
//       {
//         from: SheetJsWorkbookDataType,
//         to: relativeNestedDataType
//       },
//       ({ data }) => ({
//         type: void 0,
//         data: defer(() => {
//           return merge(new BehaviorSubject(void 0), data.workbookChanged).pipe(
//             map(() => data.getSheetNames().map(i => "#/sheet/" + i))
//           );
//         })
//       })
//     ),
//     createConverter(
//       {
//         from: resolveDataType,
//         to: SheetJsDataType
//       },
//       ({ url }) => {
//         const template = new URLTemplate("/sheet/{sheetName}/", {
//           sheetName: URLTemplate.string
//         });
//         const result = template.parse(url.href);
//         if (
//           url.protocol !== "file:" ||
//           !/\.xlsx?$/.test(url.pathname) ||
//           result == null
//         ) {
//           return null;
//         }

//         const sheetName = result.sheetName;
//         url.hash = "";
//         const data = SheetJsWorkbookDataType.getDataset(
//           registry.getURL("" + url)
//         );
//         if (data == null) return null;
//         return {
//           type: sheetName,
//           data
//         };
//       }
//     ),
//     createConverter(
//       {
//         from: SheetJsDataType,
//         to: CSVDataType
//       },
//       ({ data, type }) => {
//         return {
//           type: void 0,
//           data: defer(() => {
//             return merge(
//               new BehaviorSubject(void 0),
//               data.workbookChanged
//             ).pipe(map(() => data.toCsv(type)));
//           })
//         };
//       }
//     )
//   );
// }
