import { invoiceModel } from "../models/invoiceModel.js";
import { learnerModel } from "../models/learnerModel.js";


export const getTotalLearners = async (req, res) => {
  try {

    if (!req.auth || !req.auth.id) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const totalLearners = await learnerModel.countDocuments();
    res.status(200).json({ totalLearners });
  } catch (error) {
    res.status(500).json({ message: "Failed to get total learners", error });
  }
};



//learners for a track
export const getLearnersPerTrack = async (req, res) => {
  try {

    if (!req.auth || !req.auth.id) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const result = await invoiceModel.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: "$track",
          count: { $sum: 1 },
          // learnerCount: { $addToSet: "$learner" }

        },
      },
      
      {
        $project: {
          _id: 0,
          track: "$_id",
          learners: "$count"
        },
      },
    ]);

    res.status(200).json({ learnersPerTrack: result });
  } catch (error) {
    res.status(500).json({ message: "Failed to get learners per track", error });
  }
};



//total income
export const getTotalIncome = async (req, res) => {
  try {

    if (!req.auth || !req.auth.id) {
      return res.status(401).json({ message: "Unauthorized access" })
    }

    const result = await invoiceModel.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
        }
      },
    ]);

    const totalIncome = result[0]?.totalAmount || 0;
    res.status(200).json({ totalIncome });
  } catch (error) {
    res.status(500).json({ message: "Failed to calculate total income", error });
  }
};



export const getIncomePerTrack = async (req, res) => {
  try {

    if (!req.auth || !req.auth.id) {
      return res.status(401).json({ message: "Unauthorized access" })
    }

    const result = await invoiceModel.aggregate([
      { $match: { status: 'paid' } }, //only paid invoices
      {
        $group: {
          _id: "$track", //group by track
          totalTrackIncome: { $sum: "$amount" }, //total amount per track
        }
      },
      {
        $project: {
          _id: 0,  //removes default _id
          track: "$_id",  // rename id to track or "$name"
          totalTrackIncome: 1,    //include totalTrackIncome
        },
      },
    ]);

    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: "Failed to calculate income per track", error });
  }
};































//merging all 4 endpoints as  1
// export const getReports = async (req, res) => {
//   try {
//     if (!req.auth || !req.auth.id) {
//       return res.status(401).json({ message: "Unauthorized access" });
//     }

//     //getting total learners
//     const totalLearners = await learnerModel.countDocuments();

//     //learners per track
//     const learnersPerTrack = await learnerModel.aggregate([
//       {
//         $lookup: {
//           from: 'invoices',
//           localField: '_id',
//           foreignField: 'learner',
//           as: 'invoices',
//         },
//       },
//       { $unwind: '$invoices' },
//       {
//         $group: {
//           _id: '$invoices.track',
//           learnerCount: { $addToSet: '$_id' },
//         },
//       },
//       {
//         $project: {
//           track: '$_id',
//           learnerCount: { $size: '$learnerCount' },
//           _id: 0,
//         },
//       },
//     ]);

//     //generating total income
//     const totalIncomeResult = await invoiceModel.aggregate([
//       { $match: { status: 'paid' } },
//       { $group: { _id: null, total: { $sum: '$amount' } } },
//     ]);
//     const totalIncome = totalIncomeResult[0]?.total || 0;

//     //income per track
//     const incomePerTrack = await invoiceModel.aggregate([
//       { $match: { status: 'paid' } },
//       {
//         $group: {
//           _id: '$track',
//           total: { $sum: '$amount' },
//         },
//       },
//       {
//         $project: {
//           track: '$_id',
//           income: '$total',
//           _id: 0,
//         },
//       },
//     ]);

//     res.status(200).json({
//       totalLearners,
//       learnersPerTrack,
//       totalIncome,
//       incomePerTrack,
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to get report', error: error.message });
//   }
// };
