import Joi from "joi";


export const createTrackValidator = Joi.object({
name: Joi.string().required(),
price: Joi.number().required(),
instructor: Joi.string().required(),
duration: Joi.string().required(),
description: Joi.string().required(),
image: Joi.string().required()
});

//update track
export const updateTrackValidator = Joi.object({
name: Joi.string(),
price: Joi.number(),
instructor: Joi.string(),
duration: Joi.string(),
description: Joi.string(),
image: Joi.string()
});
