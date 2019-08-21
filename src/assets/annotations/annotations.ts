/*
 * Initial Annotations for:
 *  - KompakktLogo
 *  - Fallbackmodel
 */

export const annotationFallback = {
    validated: true,
    _id: 'DefaultAnnotation',
    identifier: 'DefaultAnnotation',
    ranking: 1,
    creator: {
        type: 'Person',
        name: 'Get User Name',
        _id: 'Get User ID',
    },
    created: new Date().toISOString(),
    generator: {
        type: 'Person',
        name: 'Get User Name',
        _id: 'Get User ID',
    },
    generated: 'Creation-Timestamp by Server',
    motivation: 'defaultMotivation',
    lastModificationDate: 'Last-Manipulation-Timestamp by Server',
    lastModifiedBy: {
        type: 'Person',
        name: 'Get User Name',
        _id: 'Get User ID',
    },
    body: {
        type: 'annotation',
        content: {
            type: 'text',
            title: 'Hi there!',
            // tslint:disable-next-line:max-line-length
            description: 'maybe this is not what you were looking for. Unfortunately we cannot display the requested entity but we are working on it. But we have something better as you can see... This entity is from https://sketchfab.com/mark2580',
            relatedPerspective: {
                cameraType: 'arcRotateCam',
                position: {
                    x: 2.7065021761026817,
                    y: 1.3419080619941322,
                    z: 90.44884111420268,
                },
                target: {
                    x: 0,
                    y: 0,
                    z: 0,
                },
                preview: 'assets/img/preview-fallback-annotation.png',
            },
        },
    },
    target: {
        source: {
            relatedEntity: 'Cube',
        },
        selector: {
            referencePoint: {
                x: -10.204414220764392,
                y: 10.142734374740286,
                z: -3.9197811803792177,
            },
            referenceNormal: {
                x: -0.8949183602315889,
                y: 0.011999712324764563,
                z: -0.44606853220612525,
            },
        },
    },
};

export const annotationLogo = [

    {
        validated: true,
        _id: 'DefaultAnnotation_01',
        identifier: 'DefaultAnnotation_01',
        ranking: 1,
        creator: {
            type: 'Person',
            name: 'Get User Name',
            _id: 'Get User ID',
        },
        created: new Date().toISOString(),
        generator: {
            type: 'Person',
            name: 'Get User Name',
            _id: 'Get User ID',
        },
        generated: 'Creation-Timestamp by Server',
        motivation: 'defaultMotivation',
        lastModificationDate: 'Last-Manipulation-Timestamp by Server',
        lastModifiedBy: {
            type: 'Person',
            name: 'Get User Name',
            _id: 'Get User ID',
        },
        body: {
            type: 'annotation',
            content: {
                type: 'text',
                title: 'Hi there!',
                // tslint:disable-next-line:max-line-length
                description: 'I am happy you come around, really nice to see you. How about walking through my annotations? Just click on the arrows below.',
                relatedPerspective: {
                    cameraType: 'arcRotateCam',
                    position: {
                        x: -1.5707963267948966,
                        y: 1.5707963267948966,
                        z: 35,
                    },
                    target: {
                        x: 0,
                        y: 0,
                        z: 0,
                    },
                    // tslint:disable-next-line:max-line-length
                    preview: 'data:image/png;base64,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',
                },
            },
        },
        target: {
            source: {
                relatedEntity: 'Cube',
            },
            selector: {
                referencePoint: {
                    x: 8.493987578893858,
                    y: -4.726197551641347,
                    z: -5.801871179111021,
                },
                referenceNormal: {
                    x: 0.4446185374233355,
                    y: 0.5440643665971285,
                    z: -0.7115534563044433,
                },
            },
        },
    },
    {
        validated: true,
        _id: 'DefaultAnnotation_02',
        identifier: 'DefaultAnnotation_02',
        ranking: 2,
        creator: {
            type: 'Person',
            name: 'Get User Name',
            _id: 'Get User ID',
        },
        created: new Date().toISOString(),
        generator: {
            type: 'Person',
            name: 'Get User Name',
            _id: 'Get User ID',
        },
        generated: 'Creation-Timestamp by Server',
        motivation: 'defaultMotivation',
        lastModificationDate: 'Last-Manipulation-Timestamp by Server',
        lastModifiedBy: {
            type: 'Person',
            name: 'Get User Name',
            _id: 'Get User ID',
        },
        body: {
            type: 'annotation',
            content: {
                type: 'text',
                title: 'Annotations are a cool thing in 3D',
                // tslint:disable-next-line:max-line-length
                description: 'If you are have a Kompakkt-account (you really should have one), you can create collections and annotate images or models you add to your collection.',
                relatedPerspective: {
                    cameraType: 'arcRotateCam',
                    position: {
                        x: -2.99758418607469,
                        y: 1.85665895628033,
                        z: 17.8484172661994,
                    },
                    target: {
                        x: 0,
                        y: 0,
                        z: 0,
                    },
                    // tslint:disable-next-line:max-line-length
                    preview: 'data:image/png;base64,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',
                },
            },
        },
        target: {
            source: {
                relatedEntity: 'Cube',
            },
            selector: {
                referencePoint: {
                    x: -2.364687440537587,
                    y: -0.5632423503632693,
                    z: -0.4455940936559628,
                },
                referenceNormal: {
                    x: -0.3320686140715924,
                    y: -0.5497618728288014,
                    z: -0.7664804751148855,
                },
            },
        },
    },
    {
        validated: true,
        _id: 'DefaultAnnotation_03',
        identifier: 'DefaultAnnotation_03',
        ranking: 3,
        creator: {
            type: 'Person',
            name: 'Get User Name',
            _id: 'Get User ID',
        },
        created: new Date().toISOString(),
        generator: {
            type: 'Person',
            name: 'Get User Name',
            _id: 'Get User ID',
        },
        generated: 'Creation-Timestamp by Server',
        motivation: 'defaultMotivation',
        lastModificationDate: 'Last-Manipulation-Timestamp by Server',
        lastModifiedBy: {
            type: 'Person',
            name: 'Get User Name',
            _id: 'Get User ID',
        },
        body: {
            type: 'annotation',
            content: {
                type: 'text',
                title: 'You found me!',
                // tslint:disable-next-line:max-line-length
                description: 'Look at me - I am an annotation of this cool logo. Please feel free to add a friend for me by double clicking this 3D logo. If you also like to be with friends, you can annotate collaborative, nice eh?',
                relatedPerspective: {
                    cameraType: 'arcRotateCam',
                    position: {
                        x: -1.5694916392948963,
                        y: 0.7551224686054129,
                        z: 35.015,
                    },
                    target: {
                        x: 0,
                        y: 0,
                        z: 0,
                    },
                    // tslint:disable-next-line:max-line-length
                    preview: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAADhCAYAAADmtuMcAAAgAElEQVR4Xu2de3yU1Z3GnzMzuZEEAgnkQiATEMWCoPW6FrksXSwKeEer9cKk6Hbt0qrd2u12a9n9tFvrrrVuqyuSRLrdavEGCHiBFdG6UsWqSAVBSCYhCSGBQMiFZDJz9nMmkGQygSRv5nLe933OP2LynnOe3/d3Zp6877m8AiwkQAIkQAIkYICAMFCHVUiABEiABEgANBAOAhIgARIgAUMEaCCGsLESCZAACZAADYRjgARIgARIwBABGoghbKxEAiRAAiRAA+EYIAESIAESMESABmIIGyuRAAmQAAnQQDgGSIAESIAEDBGggRjCxkokQAIkQAI0EI4BEiABEiABQwRoIIawsRIJkAAJkAANhGOABEiABEjAEAEaiCFsrEQCJEACJEAD4RggARIgARIwRIAGYggbK5EACZAACdBAOAZIgARIgAQMEaCBGMLGSiRAAiRAAjQQjgESIAESIAFDBGgghrCxEgmQAAmQAA2EY4AESIAESMAQARqIIWysRAIkQAIkQAPhGCABEiABEjBEgAZiCBsrkQAJkAAJ0EA4BkiABEiABAwRoIEYwsZKJEACJEACNBCOARIgARIgAUMEaCCGsLESCZAACZAADYRjgARIgARIwBABGoghbKxEAiRAAiRAA+EYIAESIAESMESABmIIGyuRAAmQAAnQQDgGSIAESIAEDBGggRjCxkokQAIkQAI0EI4BEiABEiABQwRoIIawsRIJkAAJkAANhGOABEiABEjAEAEaiCFsrEQCJEACJEAD4RggARIgARIwRIAGYggbK5EACZAACdBAOAZIgARIgAQMEaCBGMLGSiRAAiRAAjQQjgESIAESIAFDBGgghrCxEgmQAAmQAA2EY4AESIAESMAQARqIIWysRAIkQAIkQAPhGCABEiABEjBEgAZiCBsrkQAJkAAJ0EA4BkiABEiABAwRoIEYwsZKJEACJEACNBCOARIgARIgAUMEaCCGsLESCZAACZAADYRjgARIgARIwBABGoghbKxkCQKP7x2OtITFEGIRJCZDykQAmaeNTYhjkLIRAq0AtsDfsRGtcjuWTWq0BA8GQQKDJEADGSQwXm5SAsUVeYB8FgIXAjI1KlEINMCPH2N40zNYPLUpKn2wURLQiAANRKNkUEoECZSW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',
                },
            },
        },
        target: {
            source: {
                relatedEntity: 'Cube',
            },
            selector: {
                referencePoint: {
                  x: 0.22506093411376538,
                  y: 11.070164780599304,
                  z: -10.351189718516038,
                },
                referenceNormal: {
                  x: -0.1384023202829482,
                  y: 0.8233244983941522,
                  z: -0.550437615070331,
                },
            },
        },
    },
    {
        validated: true,
        _id: 'DefaultAnnotation_04',
        identifier: 'DefaultAnnotation_04',
        ranking: 4,
        creator: {
            type: 'Person',
            name: 'Get User Name',
            _id: 'Get User ID',
        },
        created: new Date().toISOString(),
        generator: {
            type: 'Person',
            name: 'Get User Name',
            _id: 'Get User ID',
        },
        generated: 'Creation-Timestamp by Server',
        motivation: 'defaultMotivation',
        lastModificationDate: 'Last-Manipulation-Timestamp by Server',
        lastModifiedBy: {
            type: 'Person',
            name: 'Get User Name',
            _id: 'Get User ID',
        },
        body: {
            type: 'annotation',
            content: {
                type: 'text',
                title: 'For annotations you can use multimedia content',
                // tslint:disable-next-line:max-line-length
                description: `![alt Cat](https://media.giphy.com/media/364GzLa1jHbgY/v1.Y2lkPTc5MGI3NjExNWQ0ODU3MWEzMjc3NjU0YzYzMTFlY2Vj/giphy.gif)`,
                relatedPerspective: {
                    cameraType: 'arcRotateCam',
                    position: {
                        x: -3.2467425164755936,
                        y: 1.5320528975270105,
                        z: 35.015,
                    }
                    ,
                    target: {
                        x: 0,
                        y: 0,
                        z: 0,
                    },
                    preview: '',
                },
            },
        },
        target: {
            source: {
                relatedEntity: 'Cube',
            },
            selector: {
                referencePoint: {
                    x: -9.048278227220166,
                    y: -5.089266310632194,
                    z: -5.5368519323891565,
                },
                referenceNormal: {
                    x: 0.7486107948277316,
                    y: -0.6006558310557132,
                    z: -0.2807034921160806,
                },
            },
        },
    },
];