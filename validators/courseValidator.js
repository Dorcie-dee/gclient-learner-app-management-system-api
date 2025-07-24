import Joi from "joi";

export const createCourseValidator = Joi.object({
title: Joi.string().required(),
track: Joi.string().required(),
image: Joi.string().required(),
// stacks: Joi.string().required(),
description: Joi.string().required()
});


//update
export const updateCourseValidator = Joi.object({
  title: Joi.string(),
  track: Joi.string().required(),
  image: Joi.string(),
  description: Joi.string()
});
