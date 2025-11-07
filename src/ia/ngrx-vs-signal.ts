import { Component, inject, Injectable, signal } from '@angular/core'
import { delay, Observable, tap, timer } from 'rxjs'
import { createActionGroup, createFeatureSelector, createReducer, createSelector, on, props, Store } from '@ngrx/store'
import { AsyncPipe } from '@angular/common'

/**
 * Impossible Angular v20.x.x
 * NgRx vs Signal
 * Author: Sergii Lutchyn
 *
 * Compare the implementation of CRUD operations using the NgRx store versus a Service with Signals.
 *
 * Usage:
 * <ia-ngrx-signal></ia-ngrx-signal>
 */


export type Item = {
    id: number | string
    name: string
}

// ****************** NgRx implementation ******************

export const ItemsActionGroup = createActionGroup({
    source: 'Items',
    events: {
        'Set Items': props<{ items: ReadonlyArray<Item> }>(),
        'Add Item': props<{ item: Item }>(),
        'Update Item': props<{ item: Item }>(),
        'Remove Item': props<{ id: string }>()
    }
})

export const initialState = [] as Array<Item>

export const itemsReducer = createReducer(
    initialState,
    on(ItemsActionGroup.setItems, (state, {items}) => [...items]),
    on(ItemsActionGroup.addItem, (state, {item}) => [...state, item]),
    on(ItemsActionGroup.updateItem, (state, {item}) =>
        state.map(obj => (obj.id === item.id) ? item : obj)
    ),
    on(ItemsActionGroup.removeItem, (state, {id}) =>
        state.filter(item => item.id !== id)
    )
)

export const itemsSelector = createFeatureSelector<ReadonlyArray<Item>>('itemsState')

export const selectItems = createSelector(
    itemsSelector,
    (items) => items
)

// ****************** Service with Signals implementation ******************

// This decorator is used to freeze input parameters in the method.
const FreezeArgs = (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
) => {
    const originalMethod = descriptor.value
    descriptor.value = function (...args: any[]) {
        deepFreeze(args)
        return originalMethod.apply(this, args)
    }
    return descriptor
}

// Recursively apply Object.freeze() to the object.
const deepFreeze = (obj: any) => {
    if (typeof obj !== 'object' || obj === null) {
        return obj
    }
    Object.freeze(obj)
    for (const key in obj) {
        deepFreeze(obj[key])
    }
}

@Injectable({providedIn: 'root'})
export class SignalStore {
    private items = signal<Array<Item>>([])

    selectItems = this.items.asReadonly()

    @FreezeArgs
    setItems(list: Array<Item>) {
        this.items.set(list)
    }

    @FreezeArgs
    addItem(item: Item) {
        this.items.update(arr => [...arr, item])
    }

    @FreezeArgs
    updItem(item: Item) {
        this.items.update(arr => arr.map(obj => (obj.id === item.id) ? item : obj))
    }

    @FreezeArgs
    removeItem(id: string) {
        this.items.update(arr => arr.filter(item => item.id !== id))
    }
}

@Component({
    selector: 'ia-ngrx-signal',
    imports: [
        AsyncPipe
    ],
    template: `
        <h3>NgRx Store items:</h3>
        @for (item of items | async; track item.id) {
            <p>id:{{ item.id }} name:{{ item.name }}</p>
        }
        <h3>Signal Store items:</h3>
        @for (item of signalStore.selectItems(); track item.id) {
            <p>id:{{ item.id }} name:{{ item.name }}</p>
        }
        <p [style.color]="'red'">Check the console for an error regarding a read-only property</p>
    `
})
export class NgrxSignalComponent {
    private store = inject(Store)
    items: Observable<ReadonlyArray<Item>> = this.store.select(selectItems)

    signalStore = inject(SignalStore)

    constructor() {
        const arr = [{id: 'id-0', name: '0'}] as Array<Item>
        this.store.dispatch(ItemsActionGroup.setItems({items: arr}))
        timer(1000).pipe(
            tap(() => this.store.dispatch(ItemsActionGroup.addItem({item: {id: 'id-5', name: '5'}}))),
            delay(1000),
            tap(() => this.store.dispatch(ItemsActionGroup.updateItem({item: {id: 'id-0', name: '00000000'}}))),
            delay(1000),
            tap(() => this.store.dispatch(ItemsActionGroup.removeItem({id: 'id-5'})))
        ).subscribe(() => {
            // test immutability for source object
            arr.push({id: 'id-1', name: '2'})
        })

        const arr2 = [{id: 'id-1', name: '1'}] as Array<Item>
        this.signalStore.setItems(arr2)
        timer(1000).pipe(
            tap(() => this.signalStore.addItem({id: 'id-5', name: '5'})),
            delay(1000),
            tap(() => this.signalStore.updItem({id: 'id-1', name: '1111111111'})),
            delay(1000),
            tap(() => this.signalStore.removeItem('id-5'))
        ).subscribe(() => {
            // test immutability for source object
            // get error on freeze object
            // arr2.push({id: 'id-2', name: '2'})
            arr2[0].name = 'freeze'
        })
    }
}
