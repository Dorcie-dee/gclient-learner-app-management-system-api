import Joi from "joi";

export const createCourseValidator = Joi.object({
title: Joi.string().required(),
track: Joi.number().required(),
image: Joi.string().required(),
stacks: Joi.string().required(),
description: Joi.string().required()
})
