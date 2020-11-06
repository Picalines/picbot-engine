module.exports = {
    roots: ['<rootDir>/src'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    testRegex: "tests\/.+\.ts$",
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
}
